/**
 * Random delay between 2 and 5 seconds
 * @returns {Promise<void>}
 */
async function randomDelay() {
  const min = 2000;
  const max = 5000;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

module.exports = {
  randomDelay
};
