const createApp = require("./app");
const { port } = require("./config");

createApp().listen(port, () => {
  console.log(`Safar listening on http://localhost:${port}`);
});
