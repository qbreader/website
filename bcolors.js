// A class that contains bash escape sequences for common colors.
// Shamelessly copied from https://svn.blender.org/svnroot/bf-blender/trunk/blender/build_files/scons/tools/bcolors.py



const bcolors = {
    HEADER: '\x1b[95m',
    OKBLUE: '\x1b[94m',
    OKCYAN: '\x1b[96m',
    OKGREEN: '\x1b[92m',
    WARNING: '\x1b[93m',
    FAIL: '\x1b[91m',
    ENDC: '\x1b[0m',
    BOLD: '\x1b[1m',
    UNDERLINE: '\x1b[4m',
};

module.exports = bcolors;
