import star from '../auth/star.js';

const starredHTML = <i className='bi bi-star-fill' />;
const unstarredHTML = <i className='bi bi-star' />;

export default function Star ({ _id, questionType, initiallyStarred }) {
  const [starred, setStarred] = React.useState(initiallyStarred);

  async function onClick (event) {
    event.preventDefault();
    event.stopPropagation();
    let successful = false;
    if (starred) {
      if (questionType === 'tossup') {
        successful = await star.unstarTossup(_id);
      } else {
        successful = await star.unstarBonus(_id);
      }
    } else {
      if (questionType === 'tossup') {
        successful = await star.starTossup(_id);
      } else {
        successful = await star.starBonus(_id);
      }
    }
    if (successful) {
      setStarred(!starred);
    }
  }

  return (
    <a href='#' id={`star-${_id}`} onClick={onClick}>
      {starred ? starredHTML : unstarredHTML}
    </a>
  );
}
