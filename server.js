import app from "./app.js";

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Court Booking server running at http://localhost:${port}`);
});
