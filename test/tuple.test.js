var R = require('ramda');
var assert = require('assert');
var types = require('./types');
var jsv = require('jsverify');

var Tuple = require('..').Tuple;
var constructor = Tuple("", "").constructor;

var TupleGen = R.curry(function(a, b, n) {
    return Tuple(a.generator(n), b.generator(n));
});

var TupleShow = R.curry(function(a, m) {
    return "Tuple(" + a.show(m[0]) + ", " + a.show(m[1]) + ")";
});

var TupleShrink = R.curry(function(a, m) {
    return [Tuple(a.shrink(m[0]), a.shrink(m[1]))];
});

var TupleArb = function(a, b) {
    return {
        generator: jsv.generator.bless(TupleGen(a, b)),
        show: TupleShow(a),
        shrink: jsv.shrink.bless(TupleShrink(a))
    };
};

var stringArb = jsv.generator.bless({
  generator: function () {
    switch (jsv.random(0, 2)) {
      case 0: return "foo";
      case 1: return "bar";
      case 2: return "quux";
    }
  },
  show: function(a){ return a; },
  shrink: jsv.shrink.bless(function(m){ return [m.slice(1)]; })
});

function mult(a) {
    return function(b) { return a * b; };
}

function add(a) {
    return function(b) { return a + b; };
}


describe('Tuple', function() {
    var m = TupleArb(stringArb, jsv.nat);

    it('has an arbitrary', function() {
        var arb = jsv.forall(m, function(m) {
            return m instanceof constructor;
        });
        jsv.assert(arb);
    });

    it('is a Semigroup', function() {
        var t = TupleArb(stringArb, stringArb);
        var t1 = TupleArb(stringArb, stringArb);
        var t2 = TupleArb(stringArb, stringArb);
        var sTest = types.semigroup;

        jsv.assert(jsv.forall(t, sTest.iface));
        jsv.assert(jsv.forall(t, t1, t2, sTest.associative));
    });

    it('is a Functor', function() {
        var fTest = types.functor;

        jsv.assert(jsv.forall(m, fTest.iface));
        jsv.assert(jsv.forall(m, fTest.id));
        jsv.assert(jsv.forall(m, 'nat -> nat', 'nat -> nat', fTest.compose));
    });

    it('is an Apply', function() {
        var aTest = types.apply;
        var appA = Tuple("", mult(10));
        var appU = Tuple("", add(7));
        var appV = Tuple("", 10);

        jsv.assert(jsv.forall(m, aTest.iface));
        assert.equal(true, aTest.compose(appA, appU, appV));
    });

    it('is an Applicative', function() {
        var aTest = types.applicative;
        var app1 = Tuple("", 101);
        var app2 = Tuple("", -123);
        var appF = Tuple("", mult(3));

        assert.equal(true, aTest.iface(app1));
        assert.equal(true, aTest.id(app1, app2));
        assert.equal(true, aTest.homomorphic(app1, add(3), 46));
        assert.equal(true, aTest.interchange(app2, appF, 17));
    });
});

describe('Tuple usage', function() {

  describe('creation', function() {
    it('should be curried', function() {
      var tpl = Tuple("dr")(true);
      assert.equal("dr", tpl[0]);
      assert.equal(true, tpl[1]);
    });

    it('should lift the value into the tuple as both positions', function() {
      var tpl = Tuple.of("pillow pets");
      assert.equal("pillow pets", tpl[0]);
      assert.equal("pillow pets", tpl[1]);
    });

    it('should maintain the current fst if it already has one', function() {
      var tpl = Tuple.of(100).of("buckaroonies");
      assert.equal(100, tpl[0]);
      assert.equal("buckaroonies", tpl[1]);
    });
  });

  describe('element access', function() {
    var tuple = Tuple("nacho", "cheese");

    it('should work with indexes', function() {
      assert.equal("nacho", tuple[0]);
      assert.equal("cheese", tuple[1]);
    });

    it('should return the value in the first position', function() {
      assert.equal("nacho", Tuple.fst(tuple));
      assert.equal("cheese", Tuple.snd(tuple));
    });

    it('should work with head', function() {
      assert.equal("nacho", R.head(tuple));
    });

    it('should work with nth', function() {
      assert.equal("cheese", R.nth(1, tuple));
    });

    it('should work with tail', function() {
      assert.equal("cheese", R.tail(tuple));
    });

    it('should work with take', function() {
      assert.equal("nacho", R.take(1, tuple)[0]);
    }
    );
    it('should work with drop', function() {
      assert.equal("cheese", R.drop(1, tuple)[0]);
    });

    it('will tell us the length', function() {
      assert.equal(2, tuple.length);
    });
  });

  describe('interface sanity check', function() {
    var tuple = Tuple("mixed", "nuts");

    it('only maps the snd', function() {
      var t = tuple.map(add("coco"));
      assert.equal("mixed", t[0]);
      assert.equal("coconuts", t[1]);
    });

    it('will combine two tuples', function() {
      var t = tuple.concat(Tuple(" chocolate", " bars"));
      assert.equal("mixed chocolate", t[0]);
      assert.equal("nuts bars", t[1]);
    });

    it('will apply and concat', function() {
      var t = Tuple("Re", "dough").map(add).ap(tuple);
      assert.equal("Remixed", t[0]);
      assert.equal("doughnuts", t[1]);
    });
  });

});
