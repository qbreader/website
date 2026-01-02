export default function tossupToHTML (tossup) {
  const div = document.createElement('div');
  const span1 = document.createElement('span');
  span1.innerHTML = `${tossup.number}. ${tossup.question}`;
  div.appendChild(span1);
  div.appendChild(document.createElement('br'));
  const span2 = document.createElement('span');
  span2.innerHTML = `ANSWER: ${tossup.answer}`;
  div.appendChild(span2);
  div.appendChild(document.createElement('br'));
  const tag = tossup.metadata ?? `${tossup.category} / ${tossup.subcategory}${tossup.alternate_subcategory ? ' / ' + tossup.alternate_subcategory : ''}`;
  div.appendChild(document.createTextNode(`<${tag}>`));
  return div;
}
