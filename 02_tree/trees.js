const {log2, uniqueDataSetColumn, majorityCnt} = require('./helps');
const fs = require('fs');

function createDataSet() {
  const dataSet = [
    [1, 1, 'yes'],
    [1, 0, 'no'],
    [0, 1, 'no'],
    [0, 0, 'no']
  ];
  const labels = ['no surfacing','flippers'];
  return {
    dataSet,
    labels
  };
}

function createLenses() {
  return [
    ['young', 'myope', 'no', 'reduced', 'no lenses'],
    ['young', 'myope', 'no', 'normal', 'soft'],
    ['young', 'myope', 'yes', 'reduced', 'no lenses'],
    ['young', 'myope', 'yes', 'normal', 'hard'],
    ['young', 'hyper', 'no', 'reduced', 'no lenses'],
    ['young', 'hyper', 'no', 'normal', 'soft'],
    ['young', 'hyper', 'yes', 'reduced', 'no lenses'],
    ['young', 'hyper', 'yes', 'normal', 'hard'],
    ['pre', 'myope', 'no', 'reduced', 'no lenses'],
    ['pre', 'myope', 'no', 'normal', 'soft'],
    ['pre', 'myope', 'yes', 'reduced', 'no lenses'],
    ['pre', 'myope', 'yes', 'normal', 'hard'],
    ['pre', 'hyper', 'no', 'reduced', 'no lenses'],
    ['pre', 'hyper', 'no', 'normal', 'soft'],
    ['pre', 'hyper', 'yes', 'reduced', 'no lenses'],
    ['pre', 'hyper', 'yes', 'normal', 'no lenses'],
    ['presbyopic', 'myope', 'no', 'reduced', 'no lenses'],
    ['presbyopic', 'myope', 'no', 'normal', 'no lenses'],
    ['presbyopic', 'myope', 'yes', 'reduced', 'no lenses'],
    ['presbyopic', 'myope', 'yes', 'normal', 'hard'],
    ['presbyopic', 'hyper', 'no', 'reduced', 'no lenses'],
    ['presbyopic', 'hyper', 'no', 'normal', 'soft'],
    ['presbyopic', 'hyper', 'yes', 'reduced', 'no lenses'],
    ['presbyopic', 'hyper', 'yes', 'normal', 'no lenses'],
  ];
}

function calcShannonEnt(dataSet) {
  const labelCounts = {};
  for (let featVec of dataSet) {
    const currentLabel = featVec[featVec.length - 1];
    if (Object.keys(labelCounts).indexOf(currentLabel) === -1) {
      labelCounts[currentLabel] = 1;
    } else {
      labelCounts[currentLabel]++;
    }
  }

  // 信息熵公式图：https://wikimedia.org/api/rest_v1/media/math/render/svg/67841ec4b4f7e6ab658842ef2f53add46a2debbd
  let shannonEnt = 0.0;
  const numEntries = dataSet.length;
  for (let i in labelCounts) {
    const x = labelCounts[i];
    const prob = x / numEntries; // p(x)
    shannonEnt = shannonEnt - prob * log2(prob); // -Σp*log(p) 
  }
  return shannonEnt;
}

function splitDataSet(dataSet, axis, value, debug = false) {
  const retDataSet = [];
  for (let featVec of dataSet) {
    if (featVec[axis] === value) {
      let reducedFeatVec = featVec.slice(0, axis);
      reducedFeatVec = reducedFeatVec.concat(featVec.slice(axis + 1));
      debug && console.log('reducedFeatVec', JSON.stringify(reducedFeatVec));
      retDataSet.push(reducedFeatVec);
    }
  }

  debug && console.log('retDataSet', JSON.stringify(retDataSet));

  return retDataSet;
}

function chooseBestFeatureToSplit(dataSet, debug = false) {
  const numberFeatures = dataSet[0].length  - 1;
  let baseEntropy = calcShannonEnt(dataSet);
  let bestInfoGain = 0.0;
  let bestFeature = -1;
  for (let i = 0; numberFeatures > i; i++) {
    const uniqueValues = uniqueDataSetColumn(dataSet, i);
    let newEntropy = 0.0;
    uniqueValues.forEach((value) => {
      const subDataSet = splitDataSet(dataSet, i, value);
      const prob = subDataSet.length / dataSet.length;
      newEntropy += prob * calcShannonEnt(subDataSet);
    });
    const infoGain = baseEntropy - newEntropy;
    if (infoGain > bestInfoGain) {
      bestInfoGain = infoGain;
      bestFeature = i;
    }
  }

  return bestFeature;
}

function createTree(dataSet, labels, debug = false) {
  const classList = dataSet.map((elements) => elements[elements.length - 1]);
  
  // 当所有的分类都属于同一类目时，停止划分数据
  let count = 0;
  classList.forEach((classItem) => {
    if (classItem === classList[0]) {
      count++;
    }
  });
  if (count == classList.length) {
    return classList[0]
  }

  // 数据集中没有其余特征时，停止划分数据
  if (dataSet[0].length === 1) {
    return majorityCnt(classList);
  }

  const bestFeat = chooseBestFeatureToSplit(dataSet, debug);
  debug && console.log('bestFeat', bestFeat);

  const bestFeatLabel = labels[bestFeat];
  const myTree = {[bestFeatLabel]: {}};
  const uniqueValues = uniqueDataSetColumn(dataSet, bestFeat);
  debug && console.log('uniqueValues', uniqueValues);

  uniqueValues.forEach((value) => {
    const subLabels = labels.filter((label, key) => key !== bestFeat);
    myTree[bestFeatLabel][value] = createTree(splitDataSet(dataSet, bestFeat, value, debug), subLabels)
  });
  return myTree;
}

function classify(inputTree, featLabels, testVec) {
  const firstStr = Object.keys(inputTree)[0];
  const secondDict = inputTree[firstStr];
  const featIndex = featLabels.indexOf(firstStr);
  const key = testVec[featIndex];
  const valueOfFeat = secondDict[key];
  if (typeof valueOfFeat === 'object') {
    return classify(valueOfFeat, featLabels, testVec);
  } else {
    return valueOfFeat;
  }
}

function storeTree(inputTree, filename) {
  fs.writeFileSync(filename, JSON.stringify(inputTree))
}

function grabTree(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'))
}

module.exports = {
  createDataSet,
  calcShannonEnt,
  splitDataSet,
  chooseBestFeatureToSplit,
  createTree,
  classify,
  storeTree,
  grabTree,
  createLenses
};