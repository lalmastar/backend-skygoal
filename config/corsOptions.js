const allowedOrigins=require('./allowedOrigins')

const corsOptions={
      origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus:200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['X-PINGOTHER', 'Content-Type',"Authorization","Origin", 'HEAD', 'OPTIONS',"Accept","Cache-Control",'Cookie','X-Requested-With'],
    credentials: true
}

module.exports = corsOptions;
