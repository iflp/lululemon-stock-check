const pMap = require('p-map');
const fetch = require('node-fetch');
const CONCURRENT_REQUEST_LIMIT = 100;

const categoryUrl = (root, categoryUrl) => (category) =>
  `${root}${categoryUrl}?cgid=${category}&start=0&sz=${1000}`;

const productInfoUrl = (root, productInfoUrl) => (pid) =>
  `${root}${productInfoUrl}?pid=${pid}&dwvar_${pid}_color=&dwvar_${pid}_color=&quantity=1`;

const pidArrMapper = (headers) => async (url) => {
  const textResponse = await fetch(url, { headers }).then((e) => e.text());
  console.log();
  if (textResponse.match(/data-pid="(.*?)">/gi) === null) {
    //cookie expired
    console.log('cookie expired');
    return [];
  } else if (textResponse.match(/interrupt.../gi)) {
    console.log('hit captcha');
    // const dom = new JSDOM(r);
    // const challengeAnswer = dom.window.document
    //   .querySelector('div#challengeQuestion')
    //   .textContent.trim();
    // console.log(`Challenge Answer is: x${challengeAnswer.trim()}x`);
    // const response = await fetch(url, {
    //   headers: { ...headers, 'x-challenge-result': challengeAnswer },
    //   method: 'POST',
    // });

    return [];
  } else {
    const pidArr = textResponse
      .match(/data-pid="(.*?)">/gi)
      .map((e) => e.split('"')[1])
      .flat();

    return pidArr;
  }
};

const pInfoMapper = (headers) => async (url) => {
  const productInfoResponse = await fetch(url, { headers }).then((e) => e.json());
  return productInfoResponse;
};

/**
 * Takes
 * @param {*} brand object
 * @returns product info json array
 */
const scrapeProducts = async (brand) => {
  const categoriesToScrape = brand.categories;
  const makeCategoryUrl = categoryUrl(brand.rootUrl, brand.categoryUrl);
  const categoryUrlArr = categoriesToScrape.map(makeCategoryUrl);

  const pidArr = (
    await pMap(categoryUrlArr, pidArrMapper(brand.headers), {
      concurrency: CONCURRENT_REQUEST_LIMIT,
    })
  ).flat();
  const makeProductInfoUrl = productInfoUrl(brand.rootUrl, brand.productInfoUrl);
  const pInfoUrlArr = pidArr.map(makeProductInfoUrl);

  console.log(pidArr);
  const pInfoArr = await pMap(pInfoUrlArr, pInfoMapper(brand.headers), {
    concurrency: CONCURRENT_REQUEST_LIMIT,
  });
  return pInfoArr;
};

module.exports = {
  scrapeProducts,
  categoryUrl,
  pidArrMapper,
  productInfoUrl,
  pInfoMapper,
};
