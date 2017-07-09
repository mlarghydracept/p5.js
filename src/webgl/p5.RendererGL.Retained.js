//Retained Mode. The default mode for rendering 3D primitives
//in WEBGL.
'use strict';

var p5 = require('../core/core');
var constants = require('../core/constants');
var hashCount = 0;
/**
 * _initBufferDefaults
 * @description initializes buffer defaults. runs each time a new geometry is
 * registered
 * @param  {String} gId  key of the geometry object
 */
p5.RendererGL.prototype._initBufferDefaults = function(gId) {
  //@TODO remove this limit on hashes in gHash
  hashCount ++;
  if(hashCount > 1000){
    var key = Object.keys(this.gHash)[0];
    delete this.gHash[key];
    hashCount --;
  }
  var gl = this.GL;
  //create a new entry in our gHash
  this.gHash[gId] = {};
  this.gHash[gId].vertexBuffer = gl.createBuffer();
  this.gHash[gId].normalBuffer = gl.createBuffer();
  this.gHash[gId].uvBuffer = gl.createBuffer();
  this.gHash[gId].indexBuffer = gl.createBuffer();
};
/**
 * createBuffers description
 * @param  {String} gId    key of the geometry object
 * @param  {p5.Geometry}  obj contains geometry data
 */
p5.RendererGL.prototype.createBuffers = function(gId, obj) {
  var gl = this.GL;
  this._setDefaultCamera();
  //initialize the gl buffers for our geom groups
  this._initBufferDefaults(gId);
  //return the current shaderProgram from our material hash
  var mId = this._getCurShaderId();
  var shaderProgram = this.mHash[mId];
  //@todo rename "numberOfItems" property to something more descriptive
  //we mult the num geom faces by 3
  this.gHash[gId].numberOfItems = obj.faces.length * 3;

  //vertex position
  shaderProgram.vertexPositionAttribute =
    gl.getAttribLocation(shaderProgram, 'aPosition');
  this._enableAttrib(shaderProgram.vertexPositionAttribute, 3);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array( vToNArray(obj.vertices) ),
    gl.STATIC_DRAW);

  //index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gHash[gId].indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array( flatten(obj.faces) ),
    gl.STATIC_DRAW);

  //vertex normal
  shaderProgram.vertexNormalAttribute =
    gl.getAttribLocation(shaderProgram, 'aNormal');
  this._enableAttrib(shaderProgram.vertexNormalAttribute, 3);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].normalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array( vToNArray(obj.vertexNormals) ),
    gl.STATIC_DRAW);

  //texture coordinate Attribute
  shaderProgram.textureCoordAttribute =
    gl.getAttribLocation(shaderProgram, 'aTexCoord');
  this._enableAttrib(shaderProgram.textureCoordAttribute, 2);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].uvBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array( flatten(obj.uvs) ),
    gl.STATIC_DRAW);

};

/**
 * Draws buffers given a geometry key ID
 * @param  {String} gId     ID in our geom hash
 * @return {p5.RendererGL} this
 */
p5.RendererGL.prototype.drawBuffers = function(gId) {
  this._setDefaultCamera();
  var gl = this.GL;
  var mId = this._getCurShaderId();
  var shaderProgram = this.mHash[mId];
  //vertex position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].vertexBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    3, gl.FLOAT, false, 0, 0);
  //vertex index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gHash[gId].indexBuffer);
  this._setMatrixUniforms(mId);
  switch (mId) {
    case 'normalVert|basicFrag':
    case 'normalVert|normalFrag':
    case 'lightVert|lightTextureFrag':
      //normal buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].normalBuffer);
      gl.vertexAttribPointer(
        shaderProgram.vertexNormalAttribute,
        3, gl.FLOAT, false, 0, 0);
      // uv buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].uvBuffer);
      gl.vertexAttribPointer(
        shaderProgram.textureCoordAttribute,
        2, gl.FLOAT, false, 0, 0);
      break;
    default:
      break;
  }
  if(this.drawMode === constants.WIREFRAME) {
    this._drawElements(gl.LINES, gId);
  } else {
    this._drawElements(gl.TRIANGLES, gId);
  }
  return this;
};

p5.RendererGL.prototype._drawElements = function(drawMode, gId) {
  var gl = this.GL;
  gl.drawElements(
    drawMode, this.gHash[gId].numberOfItems,
    gl.UNSIGNED_SHORT, 0);
  return this;
};


//Checks to see if the current shader has the attribute and if so enables it
p5.RendererGL.prototype._enableAttrib = function(loc, size) {
  var gl = this.GL;
  if(loc !== -1) {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(
      loc,
      size, gl.FLOAT, false, 0, 0);
  }
};
///////////////////////////////
//// UTILITY FUNCTIONS
//////////////////////////////
/**
 * turn a two dimensional array into one dimensional array
 * @param  {Array} arr 2-dimensional array
 * @return {Array}     1-dimensional array
 * [[1, 2, 3],[4, 5, 6]] -> [1, 2, 3, 4, 5, 6]
 */
function flatten(arr){
  if (arr.length>0){
    return arr.reduce(function(a, b){
      return a.concat(b);
    });
  } else {
    return [];
  }
}

/**
 * turn a p5.Vector Array into a one dimensional number array
 * @param  {Array} arr  an array of p5.Vector
 * @return {Array]}     a one dimensional array of numbers
 * [p5.Vector(1, 2, 3), p5.Vector(4, 5, 6)] ->
 * [1, 2, 3, 4, 5, 6]
 */
function vToNArray(arr){
  return flatten(arr.map(function(item){
    return [item.x, item.y, item.z];
  }));
}
module.exports = p5.RendererGL;
