const pMap = require('p-map');
const fetch = require('node-fetch');
const CONCURRENT_REQUEST_LIMIT = 100;

const categoryUrl = (root, categoryUrl) => (category) =>
  `${root}${categoryUrl}?cgid=${category}&start=0&sz=${1000}`;

const productInfoUrl = (root, productInfoUrl) => (pid) =>
  `${root}${productInfoUrl}?pid=${pid}&dwvar_${pid}_color=&dwvar_${pid}_color=&quantity=1`;

const pidArrMapper = async (url) => {
  const r = await fetch(url).then((e) => e.text());
  const pidArr = r
    .match(/data-pid="(.*?)">/gi)
    .map((e) => e.split('"')[1])
    .flat();

  return pidArr;
};

const pInfoMapper = (headers) => async (url) => {
  const productInfoResponse = await url(site, { headers }).then((e) => e.json());
  return productInfoResponse;
};

const pInfoMapper2 = async (url) => {
  const productInfoResponse = await url(site, { headers }).then((e) => e.json());
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
    await pMap(categoryUrlArr, pidArrMapper, { concurrency: CONCURRENT_REQUEST_LIMIT })
  ).flat();
  console.log(pidArr);
  const makeProductInfoUrl = productInfoUrl(brand.rootUrl, brand.productInfoUrl);
  const pInfoUrlArr = pidArr.map(makeProductInfoUrl);

  const wrapPInfoWithHeaders = pInfoMapper(headers);
  const pInfoArr = await pMap(pInfoUrlArr, pInfoMapper2, {
    concurrency: CONCURRENT_REQUEST_LIMIT,
  });
  return pInfoArr;
};
