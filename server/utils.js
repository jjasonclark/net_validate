var exec = require('child_process').exec;

module.exports = (function() {
    var inner = {
            getNetworks: getNetworks
        },
        networkCached,
        searchPatterns,
        unixPatterns = {
            command: 'ifconfig',
            groupSearch: /(?:^\s*$\n?)|\z/m,
            ipv4Search: /\binet\saddr:\s*((?:\d{1,3}\.){3}\d{1,3})\b/,
            interfaceSearch: /^(\S+)/m,
            macSearch: /\bHWaddr\s((?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2})\b/
        },
        macPatterns = {
            command: 'ifconfig',
            groupSearch: /(?=^\S+:)|\z/m,
            ipv4Search: /\binet\s+((?:\d{1,3}\.){3}\d{1,3})\b/,
            interfaceSearch: /^(\S+):/m,
            macSearch: /\bether\s((?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2})\b/
        },
        winNtPatterns = {
            command: 'ipconfig /all',
            groupSearch: /(?:\r\n(?=^\S.+$\r\n^\s*$))|\z/m,
            ipv4Search: /\bIPv4\sAddress[ \.]*:\s((?:\d{1,3}\.){3}\d{1,3})/,
            interfaceSearch: /^Ethernet adapter (.+?):\s*$/m,
            macSearch: /Physical Address[ \.]*:\s((?:[0-9a-fA-F]{2}-){5}[0-9a-fA-F]{2})/
        },
        win32Patterns = {
            command: 'ipconfig /all',
            groupSearch: /(?:\r\n(?=^\S.+$\r\n^\s*$))|\z/m,
            ipv4Search: /\bIP[- ][^:\r\n]+:\s*((?:\d{1,3}\.){3}\d{1,3})/,
            interfaceSearch: /^Ethernet adapter (.+?):\s*$/m,
            macSearch: /Physical Address[ \.]*:\s((?:[0-9a-fA-F]{2}-){5}[0-9a-fA-F]{2})/
        };


    switch (process.platform) {
    case 'win32':
    //case 'win64':
        searchPatterns = (process.env.OS === 'Windows_NT')
            ? winNtPatterns
            : win32Patterns;
        break;
    case 'darwin':
        searchPatterns = macPatterns;
        break;
    default:
        searchPatterns = unixPatterns;
        break;
    }

    function breakIntoGroups (input) {
        return input.split(searchPatterns.groupSearch);
    }

    function parseInterfaceName (group) {
        var matches = searchPatterns.interfaceSearch.exec(group);
        return matches && matches.length > 0 ? matches[1] : "";
    }

    function parseMac (group) {
        var matches = searchPatterns.macSearch.exec(group);
        return matches && matches.length > 0 ? matches[1] : "";
    }

    function parseIPv4 (group) {
        var matches = group.match(searchPatterns.ipv4Search);
        return matches && matches.length > 0 ? matches[1] : "";
    }

    function getNetworks (callback, bypassCache) {
        if (networkCached && !bypassCache) {
            callback(null, networkCached);
            return;
        }

        // system call
        exec(searchPatterns.command, function (error, stdout, stderr) {
            networkCached = [];
            var groups = breakIntoGroups(stdout);
            for(var group in groups) {
                var current = groups[group],
                    network = {
                        name: parseInterfaceName(current),
                        mac: parseMac(current),
                        ipv4: parseIPv4(current)
                    };
                if((network.mac !== "") && (network.name !== "" || network.ipv4 !== "")) {
                    networkCached.push(network);
                }
            }
            callback(error, networkCached);
        });
    }

    return inner;
})();