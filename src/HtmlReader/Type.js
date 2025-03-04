'use strict';

const Type = (obj) => {
  const signature = Object.prototype.toString.call(obj);
  return signature.slice(8, -1).toLowerCase();
};

Type.isObject = (data) => Type(data) === 'object';
Type.isString = (data) => Type(data) === 'string';

export default Type;
