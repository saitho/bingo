import express from 'express';
import path from 'path';
const app = express();

app.use('/', express.static(path.join(__dirname, 'public')));

app.listen(3000, () => {
    console.log('App listening on port 3000!');
});