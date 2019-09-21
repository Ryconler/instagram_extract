module.exports = {
    apps: [{
        name: 'firewall',
        script: 'app.js',
        ignore_watch: ['node_modules'],
        watch: true,
        env: {
            NODE_ENV: 'production',
            PORT: 30000,
        },
    }],
};
