/* eslint-disable */

function peg$subclass(child, parent) {
  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  if (location)
    message = message.replace(
      /\.$/,
      " at line " +
        location.start.line +
        ", column " +
        location.start.column +
        ".",
    );

  this.message = message;
  this.expected = expected;
  this.found = found;
  this.location = location;
  this.name = "PegSyntaxError";

  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

peg$SyntaxError.buildMessage = function (expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
    literal: function (expectation) {
      return '"' + literalEscape(expectation.text) + '"';
    },

    class: function (expectation) {
      var escapedParts = "",
        i;

      for (i = 0; i < expectation.parts.length; i++) {
        escapedParts +=
          expectation.parts[i] instanceof Array
            ? classEscape(expectation.parts[i][0]) +
              "-" +
              classEscape(expectation.parts[i][1])
            : classEscape(expectation.parts[i]);
      }

      return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
    },

    any: function (expectation) {
      return "any character";
    },

    end: function (expectation) {
      return "end of input";
    },

    other: function (expectation) {
      return expectation.description;
    },
  };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g, function (ch) {
        return "\\x0" + hex(ch);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) {
        return "\\x" + hex(ch);
      });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/\]/g, "\\]")
      .replace(/\^/g, "\\^")
      .replace(/-/g, "\\-")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g, function (ch) {
        return "\\x0" + hex(ch);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) {
        return "\\x" + hex(ch);
      });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = new Array(expected.length),
      i,
      j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return (
          descriptions.slice(0, -1).join(", ") +
          ", or " +
          descriptions[descriptions.length - 1]
        );
    }
  }

  function describeFound(found) {
    return found ? '"' + literalEscape(found) + '"' : "end of input";
  }

  return (
    "Expected " +
    describeExpected(expected) +
    " but " +
    describeFound(found) +
    " found."
  );
};

function peg$parse(input, options) {
  options = options !== void 0 ? options : {};

  var peg$FAILED = {},
    peg$startRuleFunctions = { query: peg$parsequery },
    peg$startRuleFunction = peg$parsequery,
    peg$c0 = function (value0) {
      return value0;
    },
    peg$c1 = function () {
      return null;
    },
    peg$c2 = function (head, type, right) {
      return { type, right };
    },
    peg$c3 = function (head, tail) {
      let root = { type: `and`, left: head, right: head };
      let current = root;

      for (let next of tail) {
        current.right = {
          type: next.type,
          left: current.right,
          right: next.right,
        };
        current = current.right;
      }

      return root.right;
    },
    peg$c4 = "and",
    peg$c5 = peg$literalExpectation("and", false),
    peg$c6 = "AND",
    peg$c7 = peg$literalExpectation("AND", false),
    peg$c8 = "&&",
    peg$c9 = peg$literalExpectation("&&", false),
    peg$c10 = "&",
    peg$c11 = peg$literalExpectation("&", false),
    peg$c12 = function () {
      return `and`;
    },
    peg$c13 = "or",
    peg$c14 = peg$literalExpectation("or", false),
    peg$c15 = "OR",
    peg$c16 = peg$literalExpectation("OR", false),
    peg$c17 = "||",
    peg$c18 = peg$literalExpectation("||", false),
    peg$c19 = "|",
    peg$c20 = peg$literalExpectation("|", false),
    peg$c21 = function () {
      return `or`;
    },
    peg$c22 = "(",
    peg$c23 = peg$literalExpectation("(", false),
    peg$c24 = ")",
    peg$c25 = peg$literalExpectation(")", false),
    peg$c26 = function (field, operator, value) {
      return { type: `filter`, field, operator, value };
    },
    peg$c27 = function (value) {
      return { type: `default`, value };
    },
    peg$c28 = /^[a-zA-Z_]/,
    peg$c29 = peg$classExpectation([["a", "z"], ["A", "Z"], "_"], false, false),
    peg$c30 = /^[=:]/,
    peg$c31 = peg$classExpectation(["=", ":"], false, false),
    peg$c32 = function () {
      return `=`;
    },
    peg$c33 = "!=",
    peg$c34 = peg$literalExpectation("!=", false),
    peg$c35 = "<",
    peg$c36 = peg$literalExpectation("<", false),
    peg$c37 = "<=",
    peg$c38 = peg$literalExpectation("<=", false),
    peg$c39 = ">",
    peg$c40 = peg$literalExpectation(">", false),
    peg$c41 = ">=",
    peg$c42 = peg$literalExpectation(">=", false),
    peg$c43 = '"',
    peg$c44 = peg$literalExpectation('"', false),
    peg$c45 = /^[0-9]/,
    peg$c46 = peg$classExpectation([["0", "9"]], false, false),
    peg$c47 = function () {
      return parseInt(text(), 10);
    },
    peg$c48 = /^[^\0-\x1F"\\]/,
    peg$c49 = peg$classExpectation(
      [["\u0000", "\u001f"], '"', "\\"],
      true,
      false,
    ),
    peg$c50 = "\\",
    peg$c51 = peg$literalExpectation("\\", false),
    peg$c52 = "/",
    peg$c53 = peg$literalExpectation("/", false),
    peg$c54 = "b",
    peg$c55 = peg$literalExpectation("b", false),
    peg$c56 = function () {
      return "\b";
    },
    peg$c57 = "f",
    peg$c58 = peg$literalExpectation("f", false),
    peg$c59 = function () {
      return "\f";
    },
    peg$c60 = "n",
    peg$c61 = peg$literalExpectation("n", false),
    peg$c62 = function () {
      return "\n";
    },
    peg$c63 = "r",
    peg$c64 = peg$literalExpectation("r", false),
    peg$c65 = function () {
      return "\r";
    },
    peg$c66 = "t",
    peg$c67 = peg$literalExpectation("t", false),
    peg$c68 = function () {
      return "\t";
    },
    peg$c69 = "u",
    peg$c70 = peg$literalExpectation("u", false),
    peg$c71 = function (digits) {
      return String.fromCharCode(parseInt(digits, 16));
    },
    peg$c72 = /^[0-9a-f]/i,
    peg$c73 = peg$classExpectation(
      [
        ["0", "9"],
        ["a", "f"],
      ],
      false,
      true,
    ),
    peg$c74 = /^[ ]/,
    peg$c75 = peg$classExpectation([" "], false, false),
    peg$currPos = 0,
    peg$savedPos = 0,
    peg$posDetailsCache = [{ line: 1, column: 1 }],
    peg$maxFailPos = 0,
    peg$maxFailExpected = [],
    peg$scopes = [],
    peg$transactions = [],
    peg$currentTransaction = undefined,
    peg$silentFails = 0,
    peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error(
        "Can't start parsing from rule \"" + options.startRule + '".',
      );
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }
  function tuple(arr) {
    return arr;
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function onRollback(fn) {
    peg$transactions[0]?.unshift(fn);
  }

  function expected(description, location) {
    location =
      location !== void 0
        ? location
        : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location,
    );
  }

  function error(message, location) {
    location =
      location !== void 0
        ? location
        : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return {
      type: "class",
      parts: parts,
      inverted: inverted,
      ignoreCase: ignoreCase,
    };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos],
      p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column,
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos),
      endPosDetails = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column,
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column,
      },
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) {
      return;
    }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$inferToken(tokenStart) {
    if (tokenStart >= input.length) return null;

    var regex = /\W/g;
    regex.lastIndex = tokenStart;

    var match = regex.exec(input);
    var tokenEnd = match ? match.index : input.length;
    var suffix = tokenEnd - tokenStart > 20 ? "..." : "";

    tokenEnd = Math.min(tokenEnd, tokenStart + 20) - suffix.length;
    tokenEnd = Math.max(tokenStart + 1, tokenEnd);

    return input.slice(tokenStart, tokenEnd) + suffix;
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location,
    );
  }

  function peg$parsequery() {
    var s0, s1, s2, s3;

    peg$transactions.unshift([]);
    s0 = peg$currPos;
    peg$transactions.unshift([]);
    s1 = peg$parse_();
    if (s1 !== peg$FAILED) {
      peg$currentTransaction = peg$transactions.shift();
      if (peg$transactions.length > 0) {
        peg$transactions[0].unshift(...peg$currentTransaction);
      } else {
        peg$currentTransaction = undefined;
      }
    } else {
      peg$transactions.shift().forEach((fn) => fn());
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseexpression();
      if (s2 !== peg$FAILED) {
        peg$transactions.unshift([]);
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 !== peg$FAILED) {
      peg$currentTransaction = peg$transactions.shift();
      if (peg$transactions.length > 0) {
        peg$transactions[0].unshift(...peg$currentTransaction);
      } else {
        peg$currentTransaction = undefined;
      }
    } else {
      peg$transactions.shift().forEach((fn) => fn());
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      peg$transactions.unshift([]);
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c1();
      }
      s0 = s1;
    }

    return s0;
  }

  function peg$parseexpression() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parsesecondary();
    if (s1 !== peg$FAILED) {
      s2 = [];
      peg$transactions.unshift([]);
      s3 = peg$currPos;
      s4 = peg$parselogical_operator();
      if (s4 !== peg$FAILED) {
        s5 = peg$parsesecondary();
        if (s5 !== peg$FAILED) {
          peg$savedPos = s3;
          s4 = peg$c2(s1, s4, s5);
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        peg$transactions.unshift([]);
        s3 = peg$currPos;
        s4 = peg$parselogical_operator();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsesecondary();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s3;
            s4 = peg$c2(s1, s4, s5);
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c3(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parselogical_operator() {
    var s0, s1, s2, s3, s4;

    peg$transactions.unshift([]);
    s0 = peg$currPos;
    peg$transactions.unshift([]);
    s1 = peg$currPos;
    s2 = peg$parse_();
    if (s2 !== peg$FAILED) {
      if (input.substr(peg$currPos, 3) === peg$c4) {
        s3 = peg$c4;
        peg$currPos += 3;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c5);
        }
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        if (s4 !== peg$FAILED) {
          s2 = [s2, s3, s4];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$currentTransaction = peg$transactions.shift();
      if (peg$transactions.length > 0) {
        peg$transactions[0].unshift(...peg$currentTransaction);
      } else {
        peg$currentTransaction = undefined;
      }
    } else {
      peg$transactions.shift().forEach((fn) => fn());
    }
    if (s1 === peg$FAILED) {
      peg$transactions.unshift([]);
      s1 = peg$currPos;
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c6) {
          s3 = peg$c6;
          peg$currPos += 3;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c7);
          }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      if (s1 === peg$FAILED) {
        peg$transactions.unshift([]);
        s1 = peg$currPos;
        peg$transactions.unshift([]);
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c8) {
            s3 = peg$c8;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c9);
            }
          }
          if (s3 !== peg$FAILED) {
            peg$transactions.unshift([]);
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              peg$currentTransaction = peg$transactions.shift();
              if (peg$transactions.length > 0) {
                peg$transactions[0].unshift(...peg$currentTransaction);
              } else {
                peg$currentTransaction = undefined;
              }
            } else {
              peg$transactions.shift().forEach((fn) => fn());
            }
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          peg$transactions.unshift([]);
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            peg$currentTransaction = peg$transactions.shift();
            if (peg$transactions.length > 0) {
              peg$transactions[0].unshift(...peg$currentTransaction);
            } else {
              peg$currentTransaction = undefined;
            }
          } else {
            peg$transactions.shift().forEach((fn) => fn());
          }
          if (s2 === peg$FAILED) {
            s2 = null;
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 38) {
              s3 = peg$c10;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c11);
              }
            }
            if (s3 !== peg$FAILED) {
              peg$transactions.unshift([]);
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                peg$currentTransaction = peg$transactions.shift();
                if (peg$transactions.length > 0) {
                  peg$transactions[0].unshift(...peg$currentTransaction);
                } else {
                  peg$currentTransaction = undefined;
                }
              } else {
                peg$transactions.shift().forEach((fn) => fn());
              }
              if (s4 === peg$FAILED) {
                s4 = null;
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        }
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c12();
    }
    s0 = s1;
    if (s0 !== peg$FAILED) {
      peg$currentTransaction = peg$transactions.shift();
      if (peg$transactions.length > 0) {
        peg$transactions[0].unshift(...peg$currentTransaction);
      } else {
        peg$currentTransaction = undefined;
      }
    } else {
      peg$transactions.shift().forEach((fn) => fn());
    }
    if (s0 === peg$FAILED) {
      peg$transactions.unshift([]);
      s0 = peg$currPos;
      peg$transactions.unshift([]);
      s1 = peg$currPos;
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c13) {
          s3 = peg$c13;
          peg$currPos += 2;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c14);
          }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      if (s1 === peg$FAILED) {
        peg$transactions.unshift([]);
        s1 = peg$currPos;
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c15) {
            s3 = peg$c15;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c16);
            }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
        if (s1 === peg$FAILED) {
          peg$transactions.unshift([]);
          s1 = peg$currPos;
          peg$transactions.unshift([]);
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            peg$currentTransaction = peg$transactions.shift();
            if (peg$transactions.length > 0) {
              peg$transactions[0].unshift(...peg$currentTransaction);
            } else {
              peg$currentTransaction = undefined;
            }
          } else {
            peg$transactions.shift().forEach((fn) => fn());
          }
          if (s2 === peg$FAILED) {
            s2 = null;
          }
          if (s2 !== peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c17) {
              s3 = peg$c17;
              peg$currPos += 2;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c18);
              }
            }
            if (s3 !== peg$FAILED) {
              peg$transactions.unshift([]);
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                peg$currentTransaction = peg$transactions.shift();
                if (peg$transactions.length > 0) {
                  peg$transactions[0].unshift(...peg$currentTransaction);
                } else {
                  peg$currentTransaction = undefined;
                }
              } else {
                peg$transactions.shift().forEach((fn) => fn());
              }
              if (s4 === peg$FAILED) {
                s4 = null;
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
          if (s1 !== peg$FAILED) {
            peg$currentTransaction = peg$transactions.shift();
            if (peg$transactions.length > 0) {
              peg$transactions[0].unshift(...peg$currentTransaction);
            } else {
              peg$currentTransaction = undefined;
            }
          } else {
            peg$transactions.shift().forEach((fn) => fn());
          }
          if (s1 === peg$FAILED) {
            s1 = peg$currPos;
            peg$transactions.unshift([]);
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              peg$currentTransaction = peg$transactions.shift();
              if (peg$transactions.length > 0) {
                peg$transactions[0].unshift(...peg$currentTransaction);
              } else {
                peg$currentTransaction = undefined;
              }
            } else {
              peg$transactions.shift().forEach((fn) => fn());
            }
            if (s2 === peg$FAILED) {
              s2 = null;
            }
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 124) {
                s3 = peg$c19;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c20);
                }
              }
              if (s3 !== peg$FAILED) {
                peg$transactions.unshift([]);
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                  peg$currentTransaction = peg$transactions.shift();
                  if (peg$transactions.length > 0) {
                    peg$transactions[0].unshift(...peg$currentTransaction);
                  } else {
                    peg$currentTransaction = undefined;
                  }
                } else {
                  peg$transactions.shift().forEach((fn) => fn());
                }
                if (s4 === peg$FAILED) {
                  s4 = null;
                }
                if (s4 !== peg$FAILED) {
                  s2 = [s2, s3, s4];
                  s1 = s2;
                } else {
                  peg$currPos = s1;
                  s1 = peg$FAILED;
                }
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c21();
      }
      s0 = s1;
      if (s0 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c12();
        }
        s0 = s1;
      }
    }

    return s0;
  }

  function peg$parsesecondary() {
    var s0, s1, s2, s3, s4, s5;

    peg$transactions.unshift([]);
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c22;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c23);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$transactions.unshift([]);
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseexpression();
        if (s3 !== peg$FAILED) {
          peg$transactions.unshift([]);
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            peg$currentTransaction = peg$transactions.shift();
            if (peg$transactions.length > 0) {
              peg$transactions[0].unshift(...peg$currentTransaction);
            } else {
              peg$currentTransaction = undefined;
            }
          } else {
            peg$transactions.shift().forEach((fn) => fn());
          }
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c24;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c25);
              }
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c0(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 !== peg$FAILED) {
      peg$currentTransaction = peg$transactions.shift();
      if (peg$transactions.length > 0) {
        peg$transactions[0].unshift(...peg$currentTransaction);
      } else {
        peg$currentTransaction = undefined;
      }
    } else {
      peg$transactions.shift().forEach((fn) => fn());
    }
    if (s0 === peg$FAILED) {
      peg$transactions.unshift([]);
      s0 = peg$currPos;
      s1 = peg$parseident();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseoperator();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsevalue();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c26(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsevalue();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c27(s1);
        }
        s0 = s1;
      }
    }

    return s0;
  }

  function peg$parseident() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = [];
    if (peg$c28.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c29);
      }
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        peg$transactions.unshift([]);
        if (peg$c28.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c29);
          }
        }
        if (s2 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }

    return s0;
  }

  function peg$parseoperator() {
    var s0, s1;

    peg$transactions.unshift([]);
    s0 = peg$currPos;
    if (peg$c30.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c31);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c32();
    }
    s0 = s1;
    if (s0 !== peg$FAILED) {
      peg$currentTransaction = peg$transactions.shift();
      if (peg$transactions.length > 0) {
        peg$transactions[0].unshift(...peg$currentTransaction);
      } else {
        peg$currentTransaction = undefined;
      }
    } else {
      peg$transactions.shift().forEach((fn) => fn());
    }
    if (s0 === peg$FAILED) {
      peg$transactions.unshift([]);
      if (input.substr(peg$currPos, 2) === peg$c33) {
        s0 = peg$c33;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c34);
        }
      }
      if (s0 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      if (s0 === peg$FAILED) {
        peg$transactions.unshift([]);
        if (input.charCodeAt(peg$currPos) === 60) {
          s0 = peg$c35;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c36);
          }
        }
        if (s0 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
        if (s0 === peg$FAILED) {
          peg$transactions.unshift([]);
          if (input.substr(peg$currPos, 2) === peg$c37) {
            s0 = peg$c37;
            peg$currPos += 2;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c38);
            }
          }
          if (s0 !== peg$FAILED) {
            peg$currentTransaction = peg$transactions.shift();
            if (peg$transactions.length > 0) {
              peg$transactions[0].unshift(...peg$currentTransaction);
            } else {
              peg$currentTransaction = undefined;
            }
          } else {
            peg$transactions.shift().forEach((fn) => fn());
          }
          if (s0 === peg$FAILED) {
            peg$transactions.unshift([]);
            if (input.charCodeAt(peg$currPos) === 62) {
              s0 = peg$c39;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c40);
              }
            }
            if (s0 !== peg$FAILED) {
              peg$currentTransaction = peg$transactions.shift();
              if (peg$transactions.length > 0) {
                peg$transactions[0].unshift(...peg$currentTransaction);
              } else {
                peg$currentTransaction = undefined;
              }
            } else {
              peg$transactions.shift().forEach((fn) => fn());
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c41) {
                s0 = peg$c41;
                peg$currPos += 2;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c42);
                }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parsevalue() {
    var s0, s1, s2, s3, s4;

    peg$transactions.unshift([]);
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 34) {
      s1 = peg$c43;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c44);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = [];
      peg$transactions.unshift([]);
      s4 = peg$parsechar();
      if (s4 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        peg$transactions.unshift([]);
        s4 = peg$parsechar();
        if (s4 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
      }
      if (s3 !== peg$FAILED) {
        s2 = input.substring(s2, peg$currPos);
      } else {
        s2 = s3;
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 34) {
          s3 = peg$c43;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c44);
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 !== peg$FAILED) {
      peg$currentTransaction = peg$transactions.shift();
      if (peg$transactions.length > 0) {
        peg$transactions[0].unshift(...peg$currentTransaction);
      } else {
        peg$currentTransaction = undefined;
      }
    } else {
      peg$transactions.shift().forEach((fn) => fn());
    }
    if (s0 === peg$FAILED) {
      peg$transactions.unshift([]);
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = [];
      if (peg$c45.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c46);
        }
      }
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          peg$transactions.unshift([]);
          if (peg$c45.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c46);
            }
          }
          if (s3 !== peg$FAILED) {
            peg$currentTransaction = peg$transactions.shift();
            if (peg$transactions.length > 0) {
              peg$transactions[0].unshift(...peg$currentTransaction);
            } else {
              peg$currentTransaction = undefined;
            }
          } else {
            peg$transactions.shift().forEach((fn) => fn());
          }
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = input.substring(s1, peg$currPos);
      } else {
        s1 = s2;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c47();
      }
      s0 = s1;
      if (s0 !== peg$FAILED) {
        peg$currentTransaction = peg$transactions.shift();
        if (peg$transactions.length > 0) {
          peg$transactions[0].unshift(...peg$currentTransaction);
        } else {
          peg$currentTransaction = undefined;
        }
      } else {
        peg$transactions.shift().forEach((fn) => fn());
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = [];
        if (peg$c28.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c29);
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            peg$transactions.unshift([]);
            if (peg$c28.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c29);
              }
            }
            if (s2 !== peg$FAILED) {
              peg$currentTransaction = peg$transactions.shift();
              if (peg$transactions.length > 0) {
                peg$transactions[0].unshift(...peg$currentTransaction);
              } else {
                peg$currentTransaction = undefined;
              }
            } else {
              peg$transactions.shift().forEach((fn) => fn());
            }
          }
        } else {
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
      }
    }

    return s0;
  }

  function peg$parsechar() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

    peg$transactions.unshift([]);
    if (peg$c48.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c49);
      }
    }
    if (s0 !== peg$FAILED) {
      peg$currentTransaction = peg$transactions.shift();
      if (peg$transactions.length > 0) {
        peg$transactions[0].unshift(...peg$currentTransaction);
      } else {
        peg$currentTransaction = undefined;
      }
    } else {
      peg$transactions.shift().forEach((fn) => fn());
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c50;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c51);
        }
      }
      if (s1 !== peg$FAILED) {
        peg$transactions.unshift([]);
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c43;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c44);
          }
        }
        if (s2 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
        if (s2 === peg$FAILED) {
          peg$transactions.unshift([]);
          if (input.charCodeAt(peg$currPos) === 92) {
            s2 = peg$c50;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c51);
            }
          }
          if (s2 !== peg$FAILED) {
            peg$currentTransaction = peg$transactions.shift();
            if (peg$transactions.length > 0) {
              peg$transactions[0].unshift(...peg$currentTransaction);
            } else {
              peg$currentTransaction = undefined;
            }
          } else {
            peg$transactions.shift().forEach((fn) => fn());
          }
          if (s2 === peg$FAILED) {
            peg$transactions.unshift([]);
            if (input.charCodeAt(peg$currPos) === 47) {
              s2 = peg$c52;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c53);
              }
            }
            if (s2 !== peg$FAILED) {
              peg$currentTransaction = peg$transactions.shift();
              if (peg$transactions.length > 0) {
                peg$transactions[0].unshift(...peg$currentTransaction);
              } else {
                peg$currentTransaction = undefined;
              }
            } else {
              peg$transactions.shift().forEach((fn) => fn());
            }
            if (s2 === peg$FAILED) {
              peg$transactions.unshift([]);
              s2 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 98) {
                s3 = peg$c54;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c55);
                }
              }
              if (s3 !== peg$FAILED) {
                peg$savedPos = s2;
                s3 = peg$c56();
              }
              s2 = s3;
              if (s2 !== peg$FAILED) {
                peg$currentTransaction = peg$transactions.shift();
                if (peg$transactions.length > 0) {
                  peg$transactions[0].unshift(...peg$currentTransaction);
                } else {
                  peg$currentTransaction = undefined;
                }
              } else {
                peg$transactions.shift().forEach((fn) => fn());
              }
              if (s2 === peg$FAILED) {
                peg$transactions.unshift([]);
                s2 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 102) {
                  s3 = peg$c57;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c58);
                  }
                }
                if (s3 !== peg$FAILED) {
                  peg$savedPos = s2;
                  s3 = peg$c59();
                }
                s2 = s3;
                if (s2 !== peg$FAILED) {
                  peg$currentTransaction = peg$transactions.shift();
                  if (peg$transactions.length > 0) {
                    peg$transactions[0].unshift(...peg$currentTransaction);
                  } else {
                    peg$currentTransaction = undefined;
                  }
                } else {
                  peg$transactions.shift().forEach((fn) => fn());
                }
                if (s2 === peg$FAILED) {
                  peg$transactions.unshift([]);
                  s2 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 110) {
                    s3 = peg$c60;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c61);
                    }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$savedPos = s2;
                    s3 = peg$c62();
                  }
                  s2 = s3;
                  if (s2 !== peg$FAILED) {
                    peg$currentTransaction = peg$transactions.shift();
                    if (peg$transactions.length > 0) {
                      peg$transactions[0].unshift(...peg$currentTransaction);
                    } else {
                      peg$currentTransaction = undefined;
                    }
                  } else {
                    peg$transactions.shift().forEach((fn) => fn());
                  }
                  if (s2 === peg$FAILED) {
                    peg$transactions.unshift([]);
                    s2 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 114) {
                      s3 = peg$c63;
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) {
                        peg$fail(peg$c64);
                      }
                    }
                    if (s3 !== peg$FAILED) {
                      peg$savedPos = s2;
                      s3 = peg$c65();
                    }
                    s2 = s3;
                    if (s2 !== peg$FAILED) {
                      peg$currentTransaction = peg$transactions.shift();
                      if (peg$transactions.length > 0) {
                        peg$transactions[0].unshift(...peg$currentTransaction);
                      } else {
                        peg$currentTransaction = undefined;
                      }
                    } else {
                      peg$transactions.shift().forEach((fn) => fn());
                    }
                    if (s2 === peg$FAILED) {
                      peg$transactions.unshift([]);
                      s2 = peg$currPos;
                      if (input.charCodeAt(peg$currPos) === 116) {
                        s3 = peg$c66;
                        peg$currPos++;
                      } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                          peg$fail(peg$c67);
                        }
                      }
                      if (s3 !== peg$FAILED) {
                        peg$savedPos = s2;
                        s3 = peg$c68();
                      }
                      s2 = s3;
                      if (s2 !== peg$FAILED) {
                        peg$currentTransaction = peg$transactions.shift();
                        if (peg$transactions.length > 0) {
                          peg$transactions[0].unshift(
                            ...peg$currentTransaction,
                          );
                        } else {
                          peg$currentTransaction = undefined;
                        }
                      } else {
                        peg$transactions.shift().forEach((fn) => fn());
                      }
                      if (s2 === peg$FAILED) {
                        s2 = peg$currPos;
                        if (input.charCodeAt(peg$currPos) === 117) {
                          s3 = peg$c69;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) {
                            peg$fail(peg$c70);
                          }
                        }
                        if (s3 !== peg$FAILED) {
                          s4 = peg$currPos;
                          s5 = peg$currPos;
                          s6 = peg$parsehex();
                          if (s6 !== peg$FAILED) {
                            s7 = peg$parsehex();
                            if (s7 !== peg$FAILED) {
                              s8 = peg$parsehex();
                              if (s8 !== peg$FAILED) {
                                s9 = peg$parsehex();
                                if (s9 !== peg$FAILED) {
                                  s6 = [s6, s7, s8, s9];
                                  s5 = s6;
                                } else {
                                  peg$currPos = s5;
                                  s5 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s5;
                                s5 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s5;
                              s5 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s5;
                            s5 = peg$FAILED;
                          }
                          if (s5 !== peg$FAILED) {
                            s4 = input.substring(s4, peg$currPos);
                          } else {
                            s4 = s5;
                          }
                          if (s4 !== peg$FAILED) {
                            peg$savedPos = s2;
                            s3 = peg$c71(s4);
                            s2 = s3;
                          } else {
                            peg$currPos = s2;
                            s2 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s2;
                          s2 = peg$FAILED;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }

  function peg$parsehex() {
    var s0;

    if (peg$c72.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c73);
      }
    }

    return s0;
  }

  function peg$parse_() {
    var s0, s1;

    s0 = [];
    if (peg$c74.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c75);
      }
    }
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        peg$transactions.unshift([]);
        if (peg$c74.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c75);
          }
        }
        if (s1 !== peg$FAILED) {
          peg$currentTransaction = peg$transactions.shift();
          if (peg$transactions.length > 0) {
            peg$transactions[0].unshift(...peg$currentTransaction);
          } else {
            peg$currentTransaction = undefined;
          }
        } else {
          peg$transactions.shift().forEach((fn) => fn());
        }
      }
    } else {
      s0 = peg$FAILED;
    }

    return s0;
  }

  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    var invalidToken = peg$inferToken(peg$maxFailPos);

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      invalidToken,
      invalidToken
        ? peg$computeLocation(
            peg$maxFailPos,
            peg$maxFailPos + invalidToken.length,
          )
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos),
    );
  }
}

export const SyntaxError = peg$SyntaxError;
export const parse = peg$parse;
