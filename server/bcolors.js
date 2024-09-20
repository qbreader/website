// A class that contains bash escape sequences for common colors.
// Shamelessly copied from https://svn.blender.org/svnroot/bf-blender/trunk/blender/build_files/scons/tools/bcolors.py

const HEADER = '\x1b[95m';
const OKBLUE = '\x1b[94m';
const OKCYAN = '\x1b[96m';
const OKGREEN = '\x1b[92m';
const WARNING = '\x1b[93m';
const FAIL = '\x1b[91m';
const ENDC = '\x1b[0m';
const BOLD = '\x1b[1m';
const UNDERLINE = '\x1b[4m';

export {
  HEADER,
  OKBLUE,
  OKCYAN,
  OKGREEN,
  WARNING,
  FAIL,
  ENDC,
  BOLD,
  UNDERLINE
};
