define(['../../courses.js'], function(courses) {
	describe("initialises", function() {
		it("can", function() {
			expect(new courses.ParametersReader('a', 'e').e).toEqual('e');
		});
	});
});
