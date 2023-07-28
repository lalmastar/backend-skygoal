const mongoose = require('mongoose');

const dbConnect = () => {
    console.log("DB Connected Successfully")
    mongoose.connect('mongodb+srv://coderlalmastar:Alex321@sky-my-goal.hwsfjpu.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    // useCreateIndex: true
})
}


module.exports = dbConnect;