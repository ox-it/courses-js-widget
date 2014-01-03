;(function(){

	function setUpTests() {
		describe('ParametersReader', function(){
		  describe('#options()', function(){
			it('should return the object supplied in the constructor', function(){
			  assert.equal('test', new ParametersReader('test', 'b'));
			})
		  })
		})
	}

	define(function(){return setUpTests})
})();
