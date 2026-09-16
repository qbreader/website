export function configurePermanentRoomSettings (room, roomName) {
  room.settings.public = true;
  room.settings.controlled = true;

  room.settings.skip = false;
  room.settings.rebuzz = false;

  room.settings.timer = true;

  const difficultyConfig = getPermanentRoomDifficulty(roomName);
  if (difficultyConfig) {
    room.query.difficulties = difficultyConfig.difficulties;
    if (room.adjustQuery) {
      room.adjustQuery(['difficulties'], [difficultyConfig.difficulties]);
    }
  }
}

function getPermanentRoomDifficulty (roomName) {
  switch (roomName) {
    case 'msquizbowl':
      return { difficulties: [1] };
    case 'hsquizbowl':
      return { difficulties: [2, 3, 4, 5] };
    case 'collegequizbowl':
      return { difficulties: [6, 7, 8, 9] };
    case 'literature':
    case 'history':
    case 'science':
    case 'fine-arts':
    case 'rmpss':
    case 'geography':
    case 'pop-culture':
      return { difficulties: [2, 3, 4, 5] };
    case 'verified-msquizbowl':
      return { difficulties: [1] };
    case 'verified-hsquizbowl':
      return { difficulties: [2, 3, 4, 5] };
    case 'verified-collegequizbowl':
      return { difficulties: [6, 7, 8, 9] };
    case 'verified-literature':
    case 'verified-history':
    case 'verified-science':
    case 'verified-fine-arts':
    case 'verified-rmpss':
    case 'verified-geography':
    case 'verified-pop-culture':
      return { difficulties: [2, 3, 4, 5] };
    default:
      return null;
  }
}
