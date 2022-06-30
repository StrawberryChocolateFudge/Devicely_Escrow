export function parseQueryString(query: string, groupByName: boolean) {
  var parsed, hasOwn, pairs, pair, name, value;

  if (typeof query != "string") {
    throw Error("Invalid input");
  }

  parsed = {};
  hasOwn = parsed.hasOwnProperty;
  query = query.replace(/\+/g, " ");
  pairs = query.split(/[&;]/);

  for (var i = 0; i < pairs.length; i++) {
    pair = pairs[i].match(/^([^=]*)=?(.*)/);
    if (pair[1]) {
      try {
        name = decodeURIComponent(pair[1]);
        value = decodeURIComponent(pair[2]);
      } catch (e) {
        throw Error("Invaid %-encoded sequence");
      }

      if (!groupByName) {
        parsed[name] = value;
      } else if (hasOwn.call(parsed, name)) {
        parsed[name].push(value);
      } else {
        parsed[name] = [value];
      }
    }
  }
  return parsed;
}
