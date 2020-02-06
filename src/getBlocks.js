/*
 * Copyright (c) 2017, Globo.com (https://github.com/globocom)
 *
 * License: MIT
 */

// @flow

import React from 'react';
import { View } from 'react-native';

import BlockQuote from './components/BlockQuote';
import DraftJsText from './components/DraftJsText';
import UnorderedListItem from './components/UnorderedListItem';
import OrderedListItem from './components/OrderedListItem';
import generateKey from './utils/generateKey';

type ParamsType = {
  contentState: {
    blocks: ?Array<*>,
    entityMap: Object,
  },
  customStyles: Object,
  atomicHandler: Function,
  navigate?: Function,
  orderedListSeparator?: string,
  customBlockHandler?: (Object, ParamsType) => any,
  depthMargin?: number,
  textProps: ?Object,
  numberOfLines?: number,
};

export const ViewAfterList = (props: Object): React$Element<*> => <View {...props} />;

const getBlocks = (params: ParamsType): ?Array<React$Element<*>> => {
  const {
    contentState,
    customStyles,
    navigate,
    orderedListSeparator,
    customBlockHandler,
    depthMargin,
    atomicHandler,
    numberOfLines,
  } = params;

  const textProps = params.textProps || {};

  if (!contentState.blocks) {
    return null;
  }

  const counters = {
    'unordered-list-item': {
      count: 0,
      type: 'unordered-list-item',
    },
    'ordered-list-item': {
      count: 0,
      type: 'ordered-list-item',
    },
  };

  const checkCounter = (counter: Object): ?React$Element<*> => {
    const myCounter = counter;

    // list types
    if (myCounter.count >= 0) {
      if (myCounter.count > 0) {
        myCounter.count = 0;
        return (
          <ViewAfterList style={customStyles && customStyles.viewAfterList} key={generateKey()} />
        );
      }
      return null;
    }

    // non list types
    if (myCounter['unordered-list-item'].count > 0 || myCounter['ordered-list-item'].count > 0) {
      myCounter['unordered-list-item'].count = 0;
      myCounter['ordered-list-item'].count = 0;
      return (
        <ViewAfterList style={customStyles && customStyles.viewAfterList} key={generateKey()} />
      );
    }

    return null;
  };

  const blocks = [];

  for (let i = 0; i < contentState.blocks.length; i++) {
    if (i === numberOfLines) {
      break;
    }

    const item = contentState.blocks[i];
    const itemData = {
      key: item.key,
      text: item.text,
      type: item.type,
      data: item.data,
      inlineStyles: item.inlineStyleRanges,
      entityRanges: item.entityRanges,
      depth: item.depth,
    };

    switch (item.type) {
      case 'unstyled':
      case 'paragraph':
      case 'header-one':
      case 'header-two':
      case 'header-three':
      case 'header-four':
      case 'header-five':
      case 'header-six':
      case 'code-block': {
        const viewBefore = checkCounter(counters);
        blocks.push(
          <View key={generateKey()}>
            {viewBefore}
            <DraftJsText
              {...itemData}
              entityMap={contentState.entityMap}
              customStyles={customStyles}
              navigate={navigate}
              textProps={textProps}
            />
          </View>
        );
        break;
      }

      case 'atomic': {
        if (atomicHandler) {
          const viewBefore = checkCounter(counters);
          const atomic = atomicHandler(item, contentState.entityMap);
          if (viewBefore) {
            blocks.push(
              <View key={generateKey()}>
                {viewBefore}
                {atomic}
              </View>
            );
            break;
          }
          blocks.push(atomic);
          break;
        }
        blocks.push(item);
        break;
      }

      case 'blockquote': {
        const viewBefore = checkCounter(counters);
        blocks.push(
          <View key={generateKey()}>
            {viewBefore}
            <BlockQuote
              {...itemData}
              entityMap={contentState.entityMap}
              customStyles={customStyles}
              navigate={navigate}
              textProps={textProps}
            />
          </View>
        );
        break;
      }

      case 'unordered-list-item': {
        counters[item.type].count += 1;
        const viewBefore = checkCounter(counters['ordered-list-item']);
        blocks.push(
          <View key={generateKey()}>
            {viewBefore}
            <UnorderedListItem
              {...itemData}
              entityMap={contentState.entityMap}
              customStyles={customStyles}
              navigate={navigate}
              defaultMarginLeft={depthMargin}
              textProps={textProps}
            />
          </View>
        );
        break;
      }

      case 'ordered-list-item': {
        const { type } = item;
        const parentIndex = counters[type].count;
        let number = 0;

        // when new ordered list reset childCounters
        if (parentIndex === 0) {
          counters[type].childCounters = [];
        }

        if (itemData.depth !== undefined && itemData.depth >= 1) {
          if (counters[type].childCounters[parentIndex] === undefined) {
            counters[type].childCounters[parentIndex] = 0;
          }
          counters[type].childCounters[parentIndex] += 1;
          number = counters[type].childCounters[parentIndex];
        } else {
          counters[type].count += 1;
          number = counters[type].count;
        }

        const viewBefore = checkCounter(counters['unordered-list-item']);
        blocks.push(
          <View key={generateKey()}>
            {viewBefore}
            <OrderedListItem
              {...itemData}
              separator={orderedListSeparator}
              counter={number}
              entityMap={contentState.entityMap}
              customStyles={customStyles}
              navigate={navigate}
              defaultMarginLeft={depthMargin}
              textProps={textProps}
            />
          </View>
        );
        break;
      }

      default: {
        const viewBefore = checkCounter(counters);
        blocks.push(
          customBlockHandler ? (
            customBlockHandler(item, params)
          ) : (
            <View key={generateKey()}>{viewBefore}</View>
          )
        );
      }
    }
  }

  return blocks;
};

export default getBlocks;
