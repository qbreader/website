// A class that contains bash escape sequences for common colors.
// Shamelessly copied from https://svn.blender.org/svnroot/bf-blender/trunk/blender/build_files/scons/tools/bcolors.py


const HEADER = '\033[95m';
const OKBLUE = '\033[94m';
const OKCYAN = '\033[96m';
const OKGREEN = '\033[92m';
const WARNING = '\033[93m';
const FAIL = '\033[91m';
const ENDC = '\033[0m';
const BOLD = '\033[1m';
const UNDERLINE = '\033[4m';

module.exports = { HEADER, OKBLUE, OKCYAN, OKGREEN, WARNING, FAIL, ENDC, BOLD, UNDERLINE };
