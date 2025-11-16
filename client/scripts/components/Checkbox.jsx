export default function Checkbox ({ checked, onClick = (event) => {}, label, value }) {
  return (
    <li className={checked ? 'active' : undefined}>
      <label>
        <input type='checkbox' value={value} onClick={onClick} checked={checked} />
        {label}
      </label>
    </li>
  );
}

export function toggleItem (item, itemList) {
  if (itemList.includes(item)) {
    return itemList.filter(i => i !== item);
  } else {
    return [...itemList, item];
  }
}
