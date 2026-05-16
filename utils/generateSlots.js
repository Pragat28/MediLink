function generateSlots(start, end) {
  const slots = [];
  let [sh, sm] = start.split(":").map(Number);
  let [eh, em] = end.split(":").map(Number);

  let startTime = sh * 60 + sm;
  let endTime = eh * 60 + em;

  while (startTime < endTime) {
    let next = startTime + 30;

    const format = (t) => {
      let h = Math.floor(t / 60);
      let m = t % 60;
      return `${h}:${m === 0 ? "00" : m}`;
    };

    slots.push(`${format(startTime)}-${format(next)}`);
    startTime = next;
  }

  return slots;
}

module.exports = generateSlots;
