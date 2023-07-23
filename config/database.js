const mongoose = require('mongoose');

const connectDatabase = () => {
    mongoose
        .connect(
            process.env.DB_URI,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }

        )
        .then(
            conn => {
                console.log(`Database Connection Successful ${conn.connection.host}`)
            }
        )
        .catch(
            err => {
                console.log(`Error: Database Connection ${err}`);
                process.exit(1);
            }
        )
}

module.exports = connectDatabase;