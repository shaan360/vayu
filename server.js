/**
 * Module dependencies.
 */

var express = require('express'),
    hbs = require('hbs'),
    redisStore = require('connect-redis')(express),
    redis = require('redis').createClient(),
    path = require('path'),
    passport = require('passport'),
    vayu = require('vayu');

var app = module.exports = express();

app.configure(function () {
    app.set('port', process.env.port || 8080);
    app.set('ipaddress', process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');
    app.set('redisport', process.env.OPENSHIFT_REDIS_PORT || 6379);
    app.set('redishost', process.env.OPENSHIFT_REDIS_HOST || 'localhost');
    app.get('redispass', process.env.REDIS_PASSWORD || '');
    
    app.set('views', __dirname + '/views');
    app.set('view engine', 'html');
    app.engine('html', require('hbs').__express);
    
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use( express.cookieParser());
    app.use(express.methodOverride());
    app.use(express.session({
        secret: "keyboard cat",
        store: new redisStore({
            host: app.get('redishost'),
            port: app.get('redisport'),
            pass: app.get('redispass'),
            client: redis
        })
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    
    //handlebars extensions
    var blocks = {};
    hbs.registerHelper('extend', function (name, context) {
        var block = blocks[name];
        if (!block) {
            block = blocks[name] = [];
        }

        block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
    });

    hbs.registerHelper('block', function (name) {
        var val = (blocks[name] || []).join('\n');

        // clear the block
        blocks[name] = [];
        return val;
    });
    
    hbs.registerPartials(__dirname + '/views/partials');
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

vayu.init(app);

app.listen(app.get('port'), app.get('ipaddress'));
console.log('Listening on port ' + app.get('port'));