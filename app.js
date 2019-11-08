/* less is more */
const http = require('http');
const url = require('url');
const request = require('request');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const devFlag = process.env.NODE_ENV !== 'production';
// const webDomain = devFlag ? 'http://localhost:8080' : 'https://www.jessezhu.cn';  // 前端域名
const webDomain = 'https://www.jessezhu.cn';  // 前端域名

// 创建http server，并传入回调函数:
const server = http.createServer(function (request, response) {
    console.log(request.method + ': ' + request.url);
    response.setHeader('Access-Control-Allow-Origin', webDomain);
    response.writeHead(200, {'Content-Type': 'text/plain'});
    const urlSplit = url.parse(request.url).pathname.split('/'),
        router = urlSplit[1];
    switch (router) {
        case 'instagram':
            getInstagram(urlSplit[3], function (result) {
                response.end(JSON.stringify({
                    result: result,
                    message: 'success'
                }));
            });
            break;
        case undefined:
        default:
            response.end(JSON.stringify({
                result: [],
                message: 'success'
            }));
    }
});

// 让服务器监听3000端口:
server.listen(process.env.PORT || 3000);

console.log(`Server is running at http://127.0.0.1:${process.env.PORT || 3000}/`);


function getInstagram(id, callback) {
    if (!id) {
        callback && callback([]);
        return;
    }
    const result = [],
        urlOptions = {
            url: 'https://www.instagram.com/p/' + id,
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
                'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
                'cache-control': 'max-age=0',
                'cookie': 'mid=XKwJoQALAAHUfGBL4n74e9TTsCnr; csrftoken=zp7nc86gqHCx0iR5tTDrlg1tZSoiCL05; ds_user_id=9495897641; sessionid=9495897641%3AQ09GmobfpRDzzD%3A26; shbid=19490; shbts=1564656743.4391925; rur=FRC; urlgen="{\"167.179.93.73\": 20473}:1hu5Ga:neJOsrdQhzO8Iq5Mg8zcjjeVqBI"',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36'
            },
            encoding: null
        };
    console.log('开始获取Instagram动态' + id + '的内容');
    request(urlOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let html = iconv.decode(body, 'gb2312');
            const $ = cheerio.load(html);
            $('script').each(function () {
                let scriptText = $(this).html().replace(/\s+/g, '');
                if (scriptText.indexOf('window._sharedData=') !== -1) {
                    const sharedDataStr = scriptText.match(/window._sharedData=(\S*);/)[1];
                    try {
                        const sharedData = JSON.parse(sharedDataStr);
                        // console.log(sharedDataStr);
                        const shortcode_media = sharedData.entry_data.PostPage[0].graphql.shortcode_media;
                        if (shortcode_media.edge_sidecar_to_children) {  // 多张图片
                            const edges = sharedData.entry_data.PostPage[0].graphql.shortcode_media.edge_sidecar_to_children.edges;
                            edges.forEach(function (edge) {
                                result.push(edge.node.display_url);
                            });
                            console.log('成功获取' + result.length + '张照片');
                        } else {  // 单张图片
                            if (shortcode_media.video_url) {  // 单个视频
                                result.push(shortcode_media.video_url);
                                console.log('成功获取一个视频');
                            } else {
                                result.push(shortcode_media.display_url);
                                console.log('成功获取一张照片');
                            }
                        }
                    } catch (e) {
                        console.log('解析Instagram出错');
                        console.log(e);
                    }
                    callback && callback(result);
                }
            })
        } else {
            console.log('访问Instagram出错');
            callback && callback([]);
        }
    })
}
