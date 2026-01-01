export default function mongoIdToDate (_id) {
  const timestamp = _id.toString().substring(0, 8);
  return new window.Date(parseInt(timestamp, 16) * 1000);
}
