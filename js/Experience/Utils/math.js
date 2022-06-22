// Source: https://gist.github.com/gre/1650294
const easeOutCubic = function (t) {
  return --t * t * t + 1
}

// Scaling curve causes particles to grow quickly, ease gradually into full scale, then
// disappear quickly. More of the particle's lifetime is spent around full scale.
export const scaleCurve = (t) => {
  return Math.abs(easeOutCubic((t > 0.5 ? 1 - t : t) * 2))
}
