const createApp = require("./app");
const { port } = require("./config");

createApp().listen(port, () => {
  console.log(`Quarry listening on http://localhost:${port}`);
});
