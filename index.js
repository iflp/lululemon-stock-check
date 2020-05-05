const http = require('http');
const fetch = require('node-fetch');
const router = require('find-my-way');
const pMap = require('p-map');

const hostname = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 8080;

const lululemon = {
  rootUrl: 'https://www.lululemon.com.au',
  productInfoUrl: '/on/demandware.store/Sites-AU-Site/en_AU/Product-Variation',
  categoryUrl: '/on/demandware.store/Sites-AU-Site/en_AU/Search-UpdateGrid',
  categories: ['all-womens-bottoms', 'all-womens-tops', 'accessories'],
};

const ugg = {
  rootUrl: 'https://au.ugg.com',
  productInfoUrl: '/on/demandware.store/Sites-au-ugg-Site/en_AU/Product-Variation',
  categoryUrl: '/on/demandware.store/Sites-au-ugg-Site/en_AU/Search-UpdateGrid',
  categories: ['women-shop_all'],
};

// {
//   headers: {
//     Host: 'au.ugg.com',
//     'user-agent':
//       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
//     referer: 'https://au.ugg.com',
//     accept:
//       'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
//     'accept-encoding': 'gzip, deflate, br',
//     'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
//     cookie:
//       '__cfduid=dc2a9cd5501fe4d41b094196fb04a5d371588641138; ABTasty=uid=3nx2bxr0h2k21jb5&fst=1588641140017&pst=-1&cst=1588641140017&ns=1&pvt=1&pvis=1&th=; RT="z=1&dm=ugg.com&si=z742yffnvqm&ss=k9t7x1rz&sl=0&tt=0"; _cs_c=1; _cs_id=70cc1dcd-bf04-a389-bdc4-e751dca77b47.1588641142.1.1588641142.1588641142.1.1622805142192.Lax.0; _cs_s=1.3; forterToken=38298ff490224870b64ba576a14ab74f_1588641141621__UDF43_6; ftr_ncd=6; ak_bmsc=CF219C094410862336E6B4C970C5823B17D1B7CD2C41000074BDB05E4D5DB712~pl7KC2LN0XKe+ZVn2BLxrf1hT8lzos71vdgzaz/cO2VV6gciSC0OFgKXL7UBDLhUKi0b4oAsBbtZnBIFmjlB6WVfVuxFn1ZoZtu5QcS6snvcMg/BDwu8ogEdc5clFbh4wYbWZYecjHZ54UwAeXQan/m2NIG0HX6+sVOFo9qweUaR/1XtC3bu6c4nD66dOPzsVq+gu3077cIU+Js3scr1EovW5b04yDoHuLWhZ8REkm0ylL44RJU9mOF/iEWh7UWSOU; AMP_TOKEN=%24NOT_FOUND; _ga=GA1.2.1606604471.1588641144; _gid=GA1.2.1851112566.1588641144; __cq_uuid=7a28b8d0-8e6d-11ea-8d80-f1e1349d2bf0; __cq_seg=0~0.00!1~0.00!2~0.00!3~0.00!4~0.00!5~0.00!6~0.00!7~0.00!8~0.00!9~0.00; bm_sv=98D2933ED162F2BB24B14499F8C1A2A3~A3RkFIZcOsNVcgPi5+N7b+weA6W0t6qRTOFfyH212twFSbPBODBq5U5xLudf5nLJFSThHVc74+PDIE/aXSqb/+xQWyH6uRp18MuT9aV1qx3z06fdHW8Kty1MH3BspKDEHVvn7554oXsJXiW1nEeP8g==; __idcontext=eyJjb29raWVJRCI6IkhYQ1hPQzRLM0xYREpBTU83U01PRFZVSUVCSEFMMzVGRFRHREM1SzZJUUtRPT09PSIsImRldmljZUlEIjoiSFhDWE9DNEszSFhTVE5OTTJYNU9ESUZJQUJYUUxDT0FERFBITVBJSko0WEE9PT09IiwiaXYiOiI3MlhaS1VGUjNJTUlMSkJERlM1QzVNWkozST09PT09PSIsInYiOjF9; ABTastySession=mrasn=&lp=https://www.ugg.com/&sen=1; _gcl_au=1.1.140922159.1588641145; _fbp=fb.1.1588641145418.235346388; _uetsid=_uet2e051d60-e2db-c7a8-75eb-110cb154133d; stc116475=tsa:1588641145499.595692321.7904153.07860085088458746.:20200505014225|env:1%7C20200605011225%7C20200505014225%7C1%7C1060010:20210505011225|uid:1588641145499.1872476658.3806415.116475.963324284.:20210505011225|srchist:1060010%3A1%3A20200605011225:20210505011225; utag_main=v_id:0171e264144e00ac2cd8347461b803073001406b00bd0$_sn:1$_ss:1$_pn:1%3Bexp-session$_st:1588642946526$ses_id:1588641141838%3Bexp-session$dc_visit:1$dc_event:2%3Bexp-session$dc_region:ap-southeast-2%3Bexp-session; NM()sdf=8a4d2a08-a54a-6fbd-7234-b39e2131b73c; dwac_5e2bf6fc619a8816293648f4a6=qB8MEjIxirqIo7dw4lEns78NJpC36lW9tCY%3D|dw-only|||AUD|false|Australia%2FSydney|true; cqcid=bcsIp8ijz8VvuyXlX0aRsYzQw3; sid=qB8MEjIxirqIo7dw4lEns78NJpC36lW9tCY; dwanonymous_cb05254c9f0398b5354fd9207c2faad3=bcsIp8ijz8VvuyXlX0aRsYzQw3; __cq_dnt=0; dw_dnt=0; dwsid=MAOEbuC5XaBd7mhcJtfg9ycRruxlYoKnYWtjrnmdVRRuell7boPcH__vkMeuIEW5s4Yefzcfu99pSGfDeaETcw==; __storejs__=%22__storejs__%22; sc.InTg=a; VePushToken=21543897-4d36-432d-8282-1ef1bc8c6f6c.D56BD510-C561-49E3-A42B-A9F28EB25201; sc.ASP.NET_SESSIONID=oh34414xvv2legmnnebbdpt3; 224SiteTimer=0; sc.UserId=955a8dd5-b218-4c5f-bc59-d0134dbb08f0; _gat_UA-42347613-1=1; 19054.vst=%7B%22s%22%3A%22c22f84b2-1400-4ae1-82ef-088fcbd44a34%22%2C%22t%22%3A%22new%22%2C%22lu%22%3A1588641351524%2C%22lv%22%3A1588641186179%2C%22lp%22%3A0%7D; KP_UIDz=qPwv%2BooMAKaKOSoyJFxZPg%3D%3D%3A%3AZU0JJiWfNjeks83VGyS2GFJWV0eY0hIc7SugFm87JBIi1W5N8c%2Fx1ZUgn2EvYpqsnES0F4tOP8SuCT4UfmEwbrdY5DxKcD5RhkH1JliPnAZEUkrquI1F76r10Og4RROIKZ6ZHAk4H2Wbv19AKkoqzusvBzMEPY3M1YmitdVseMJib21tP7w781uEcXqlZMPLR2LWPRAe6bbOYCQ9V3y2kWJ36%2FaGvnNRE6Zm194Xty%2BHdfs%2BWGWQnRrkjelll%2B0fQyrHgxFzftFd5xFwCfr%2F7JgLVw1p2Pf8RFYrX9z1nWO0Sn%2B%2F4MpVu3YpgJSVXeqioWGcFAd86v8%2BFBtgDZUVPhjuw5YmfqTLDPc1F6u5dm0MjszYTwq7gCh19EYJg9%2BI25b0wT3wlciwt%2BxhW9Yb1fzS4nYOsTqLGvyWWA7ZhJMixXwBehe1zRwaRCWtt0qghpAoPU5ItoDoUi50Wp5xCSCIO9jboyMrhHgcOfi%2BkYCLLNIuAfY%2FJzJqApsM%2FSggZN2Va4F7oM6THS1Z%2B2Nvog6N1NuyhsamLtzCbA%2Fk85c%3D',
//   },
// }

const categoryUrl = (root, categoryUrl) => (category) =>
  `${root}${categoryUrl}?cgid=${category}&start=0&sz=${1000}`;

const productInfoUrl = (root, productInfoUrl) => (pid) =>
  `${root}${productInfoUrl}?pid=${pid}&dwvar_${pid}_color=&dwvar_${pid}_color=&quantity=1`;

const pidArrMapper = (headers) => async (url) => {
  const r = await fetch(url).then((e) => e.text());
  const pidArr = r
    .match(/data-pid="(.*?)">/gi)
    .map((e) => e.split('"')[1])
    .flat();

  return pidArr;
};

const pInfoMapper = (headers) => async (site) => {
  const productInfoResponse = await fetch(site).then((e) => e.json());
  return productInfoResponse;
};

const HTMLRowMapper = async (productJson) => {
  const pageLink = `https://www.lululemon.com.au${productJson.product.selectedProductUrl}`;
  const listItemArray = await pMap(productJson.product.variationAttributes[0].values, colorMapper, {
    concurrency: 5,
  });

  return `<tr><td><a href="${pageLink}" target="_blank">${
    productJson.product.productName
  }</a></td><td>${
    productJson.product.price.sales ? productJson.product.price.sales.formatted : '-'
  }</td><td>${productJson.product.price.list ? productJson.product.price.list.formatted : '-'}</td>
  <td><ul>
  ${listItemArray.join('')}
  </ul></td></tr>`;
};

const colorMapper = async (productColorValues) => {
  if (!productColorValues.selectable) return '';

  const stockResponse = await fetch(productColorValues.url).then((e) => e.json());
  const stockArray = stockResponse.product.variationAttributes[1].values.map(mapSizesReturnString);

  return `<li><img src="${
    productColorValues.images.swatch[0].url
  }" style="border: 1px solid black; width: 32px; height: 32px" /> ${
    productColorValues.displayValue
  } - ${stockArray.join(',')} </li>`;
};

const mapSizesReturnString = (sizeValue) => {
  if (sizeValue.selectable) {
    return sizeValue.displayValue;
  }
};

const makeHTMLHead =
  '<style>table, th, td {border: 1px solid black;} td { padding: 5px;}</style><table style="width:100%"><tr><th style="text-align:left;">Item</th><th  style="text-align:left;">price1</th><th  style="text-align:left;">price2</th><th  style="text-align:left;">Stock</th></tr>';

const scrapeProducts = async (brand) => {
  const categoriesToScrape = brand.categories;
  const makeCategoryUrl = categoryUrl(brand.rootUrl, brand.categoryUrl);
  const categoryUrlArr = categoriesToScrape.map(makeCategoryUrl);

  const pidArr = (await pMap(categoryUrlArr, pidArrMapper, { concurrency: 100 })).flat();
  const makeProductInfoUrl = productInfoUrl(brand.rootUrl, brand.productInfoUrl);
  const pInfoUrlArr = pidArr.map(makeProductInfoUrl);

  const pInfoArr = await pMap(pInfoUrlArr, pInfoMapper, { concurrency: 100 });
  return pInfoArr;
};

// router.on('GET', '/', controllers.getMeetings);
// router.on('GET', '/lululemon', controllers.getMeetings);
// router.on('GET', '/ugg', controllers.getMeetings);

const server = http.createServer(async (req, res) => {
  if (req.url === '/favicon.ico') {
    //get rid of annoying favicon call from browsers
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end();
    return;
  }

  // router.lookup(req, res);

  const productsArr = await scrapeProducts(lululemon);
  const HTMLRows = await pMap(productsArr, HTMLRowMapper, { concurrency: 100 });
  const result = makeHTMLHead + HTMLRows.join('') + '</table>';
  res.end(result);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
