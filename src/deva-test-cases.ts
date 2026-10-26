export type DevaTestCase = { input: string; output: string };
export type DevaProblemTests = { prompt: string; examples: DevaTestCase[] };

// Five LeetCode-style examples per problem. Inputs use the standard LeetCode
// argument names and outputs use JSON so they can be copied into a submission.
const examples: Record<number, [string, string][]> = {
  1: [["nums = [2,7,11,15], target = 9", "[0,1]"], ["nums = [3,2,4], target = 6", "[1,2]"], ["nums = [3,3], target = 6", "[0,1]"], ["nums = [-1,-2,-3,-4,-5], target = -8", "[2,4]"], ["nums = [0,4,3,0], target = 0", "[0,3]"]],
  2: [["s = \"anagram\", t = \"nagaram\"", "true"], ["s = \"rat\", t = \"car\"", "false"], ["s = \"a\", t = \"a\"", "true"], ["s = \"ab\", t = \"a\"", "false"], ["s = \"listen\", t = \"silent\"", "true"]],
  3: [["strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]"], ["strs = [\"\"]", "[[\"\"]]"], ["strs = [\"a\"]", "[[\"a\"]]"], ["strs = [\"abc\",\"bca\",\"xyz\"]", "[[\"abc\",\"bca\"],[\"xyz\"]]"], ["strs = [\"\",\"\"]", "[[\"\",\"\"]]"]],
  4: [["nums = [1,1,1,2,2,3], k = 2", "[1,2]"], ["nums = [1], k = 1", "[1]"], ["nums = [4,4,4,6,6,7], k = 1", "[4]"], ["nums = [1,2,2,3,3], k = 2", "[2,3]"], ["nums = [-1,-1,2,2,2], k = 1", "[2]"]],
  5: [["nums = [1,2,3,4]", "[24,12,8,6]"], ["nums = [-1,1,0,-3,3]", "[0,0,9,0,0]"], ["nums = [2,3]", "[3,2]"], ["nums = [0,0]", "[0,0]"], ["nums = [1,2,0,4]", "[0,0,8,0]"]],
  6: [["s = \"A man, a plan, a canal: Panama\"", "true"], ["s = \"race a car\"", "false"], ["s = \" \"", "true"], ["s = \"0P\"", "false"], ["s = \"abba\"", "true"]],
  7: [["nums = [-1,0,1,2,-1,-4]", "[[-1,-1,2],[-1,0,1]]"], ["nums = []", "[]"], ["nums = [0,1,1]", "[]"], ["nums = [0,0,0]", "[[0,0,0]]"], ["nums = [-2,0,1,1,2]", "[[-2,0,2],[-2,1,1]]"]],
  8: [["height = [1,8,6,2,5,4,8,3,7]", "49"], ["height = [1,1]", "1"], ["height = [4,3,2,1,4]", "16"], ["height = [1,2,1]", "2"], ["height = [2,3,4,5,18,17,6]", "17"]],
  9: [["height = [0,1,0,2,1,0,1,3,2,1,2,1]", "6"], ["height = [4,2,0,3,2,5]", "9"], ["height = [1,0,1]", "1"], ["height = [2,0,2]", "2"], ["height = [3,0,1,0,4]", "6"]],
  10: [["prices = [7,1,5,3,6,4]", "5"], ["prices = [7,6,4,3,1]", "0"], ["prices = [1,2]", "1"], ["prices = [2,4,1]", "2"], ["prices = [3,3,3]", "0"]],
  11: [["s = \"abcabcbb\"", "3"], ["s = \"bbbbb\"", "1"], ["s = \"pwwkew\"", "3"], ["s = \"\"", "0"], ["s = \"dvdf\"", "3"]],
  12: [["s = \"ABAB\", k = 2", "4"], ["s = \"AABABBA\", k = 1", "4"], ["s = \"AAAA\", k = 0", "4"], ["s = \"ABCD\", k = 0", "1"], ["s = \"BAAAB\", k = 2", "5"]],
  13: [["s = \"ADOBECODEBANC\", t = \"ABC\"", "\"BANC\""], ["s = \"a\", t = \"a\"", "\"a\""], ["s = \"a\", t = \"aa\"", "\"\""], ["s = \"ab\", t = \"b\"", "\"b\""], ["s = \"aa\", t = \"aa\"", "\"aa\""]],
  14: [["s = \"()\"", "true"], ["s = \"()[]{}\"", "true"], ["s = \"(]\"", "false"], ["s = \"([])\"", "true"], ["s = \"((\"", "false"]],
  15: [["operations = [push(1), push(2), top(), pop(), getMin()]", "[2,null,1]"], ["operations = [push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()]", "[-3,null,0,-2]"], ["operations = [push(5), getMin()]", "[5]"], ["operations = [push(3), push(1), getMin(), pop(), getMin()]", "[1,null,3]"], ["operations = [push(7), pop()]", "[null]"]],
  16: [["tokens = [\"2\",\"1\",\"+\",\"3\",\"*\"]", "9"], ["tokens = [\"4\",\"13\",\"5\",\"/\",\"+\"]", "6"], ["tokens = [\"10\",\"6\",\"9\",\"3\",\"+\",\"-11\",\"*\",\"/\",\"*\",\"17\",\"+\",\"5\",\"+\"]", "22"], ["tokens = [\"3\",\"-4\",\"+\"]", "-1"], ["tokens = [\"18\"]", "18"]],
  17: [["temperatures = [73,74,75,71,69,72,76,73]", "[1,1,4,2,1,1,0,0]"], ["temperatures = [30,40,50,60]", "[1,1,1,0]"], ["temperatures = [30,60,90]", "[1,1,0]"], ["temperatures = [90,80,70]", "[0,0,0]"], ["temperatures = [70,70,71]", "[2,1,0]"]],
  18: [["nums = [-1,0,3,5,9,12], target = 9", "4"], ["nums = [-1,0,3,5,9,12], target = 2", "-1"], ["nums = [], target = 5", "-1"], ["nums = [5], target = 5", "0"], ["nums = [1,3,5,7], target = 7", "3"]],
  19: [["matrix = [[1,3,5],[7,9,11]], target = 9", "true"], ["matrix = [[1,3,5],[7,9,11]], target = 2", "false"], ["matrix = [[1]], target = 1", "true"], ["matrix = [[1,3]], target = 3", "true"], ["matrix = [[1],[3],[5]], target = 4", "false"]],
  20: [["piles = [3,6,7,11], h = 8", "4"], ["piles = [30,11,23,4,20], h = 5", "30"], ["piles = [30,11,23,4,20], h = 6", "23"], ["piles = [312884470], h = 312884469", "2"], ["piles = [1,1,1], h = 3", "1"]],
  21: [["head = [1,2,3,4,5]", "[5,4,3,2,1]"], ["head = [1,2]", "[2,1]"], ["head = []", "[]"], ["head = [7]", "[7]"], ["head = [1,2,3]", "[3,2,1]"]],
  22: [["list1 = [1,2,4], list2 = [1,3,4]", "[1,1,2,3,4,4]"], ["list1 = [], list2 = []", "[]"], ["list1 = [], list2 = [0]", "[0]"], ["list1 = [2], list2 = [1]", "[1,2]"], ["list1 = [-9,3], list2 = [5,7]", "[-9,3,5,7]"]],
  23: [["head = [1,2,3,4]", "[1,4,2,3]"], ["head = [1,2,3,4,5]", "[1,5,2,4,3]"], ["head = [1]", "[1]"], ["head = [1,2]", "[1,2]"], ["head = []", "[]"]],
  24: [["head = [1,2,3,4,5], n = 2", "[1,2,3,5]"], ["head = [1], n = 1", "[]"], ["head = [1,2], n = 1", "[1]"], ["head = [1,2], n = 2", "[2]"], ["head = [1,2,3], n = 3", "[2,3]"]],
  25: [["capacity = 2, operations = [put(1,1), put(2,2), get(1), put(3,3), get(2), get(3)]", "[null,null,1,null,-1,3]"], ["capacity = 1, operations = [put(1,1), get(1), put(2,2), get(1), get(2)]", "[null,1,null,-1,2]"], ["capacity = 2, operations = [get(1)]", "[-1]"], ["capacity = 2, operations = [put(1,1), put(2,2), get(2), get(1)]", "[null,null,2,1]"], ["capacity = 1, operations = [put(1,1), put(2,2), get(1)]", "[null,null,-1]"]],
  26: [["root = [4,2,7,1,3,6,9]", "[4,7,2,9,6,3,1]"], ["root = [2,1,3]", "[2,3,1]"], ["root = []", "[]"], ["root = [1]", "[1]"], ["root = [1,2]", "[1,null,2]"]],
  27: [["root = [3,9,20,null,null,15,7]", "3"], ["root = [1,null,2]", "2"], ["root = []", "0"], ["root = [1]", "1"], ["root = [1,2,3,4]", "3"]],
  28: [["root = [3,9,20,null,null,15,7]", "[[3],[9,20],[15,7]]"], ["root = [1]", "[[1]]"], ["root = []", "[]"], ["root = [1,2,3]", "[[1],[2,3]]"], ["root = [1,2,3,4,5]", "[[1],[2,3],[4,5]]"]],
  29: [["root = [2,1,3]", "true"], ["root = [5,1,4,null,null,3,6]", "false"], ["root = []", "true"], ["root = [1,1]", "false"], ["root = [5,4,6,3,7]", "true"]],
  30: [["root = [3,1,4,null,2], k = 1", "1"], ["root = [5,3,6,2,4,null,null,1], k = 3", "3"], ["root = [1], k = 1", "1"], ["root = [2,1,3], k = 2", "2"], ["root = [7,3,9,1,5], k = 4", "7"]],
  31: [["nums = [1,2,3]", "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]"], ["nums = [0]", "[[],[0]]"], ["nums = []", "[[]]"], ["nums = [1,2]", "[[],[1],[2],[1,2]]"], ["nums = [-1,0,1]", "[[],[-1],[0],[-1,0],[1],[-1,1],[0,1],[-1,0,1]]"]],
  32: [["candidates = [2,3,6,7], target = 7", "[[2,2,3],[7]]"], ["candidates = [2,3,5], target = 8", "[[2,2,2,2],[2,3,3],[3,5]]"], ["candidates = [2], target = 1", "[]"], ["candidates = [1], target = 2", "[[1,1]]"], ["candidates = [1,2], target = 3", "[[1,1,1],[1,2]]"]],
  33: [["nums = [1,2,3]", "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"], ["nums = [0,1]", "[[0,1],[1,0]]"], ["nums = [1]", "[[1]]"], ["nums = []", "[[]]"], ["nums = [1,2]", "[[1,2],[2,1]]"]],
  34: [["board = [[A,B,C,E],[S,F,C,S],[A,D,E,E]], word = \"ABCCED\"", "true"], ["board = [[A,B,C,E],[S,F,C,S],[A,D,E,E]], word = \"SEE\"", "true"], ["board = [[A,B,C,E],[S,F,C,S],[A,D,E,E]], word = \"ABCB\"", "false"], ["board = [[A]], word = \"A\"", "true"], ["board = [[A,B]], word = \"BA\"", "true"]],
  35: [["n = 4", "[[.Q..,...Q,Q...,..Q.],[..Q.,Q..., ...Q,.Q..]]"], ["n = 1", "[[Q]]"], ["n = 2", "[]"], ["n = 3", "[]"], ["n = 5", "10 valid boards"]],
  36: [["grid = [[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]", "3"], ["grid = [[1,1,1],[0,1,0],[1,1,1]]", "1"], ["grid = [[0]]", "0"], ["grid = [[1]]", "1"], ["grid = [[1,0,1],[0,1,0]]", "3"]],
  37: [["adjList = [[2,4],[1,3],[2,4],[1,3]], start = 1", "[[2,4],[1,3],[2,4],[1,3]] (deep copy)"], ["adjList = [[]], start = 1", "[[]] (deep copy)"], ["adjList = [], start = null", "[]"], ["adjList = [[2],[1]], start = 1", "[[2],[1]] (deep copy)"], ["adjList = [[2],[1,3],[2]], start = 1", "[[2],[1,3],[2]] (deep copy)"]],
  38: [["grid = [[2,1,1],[1,1,0],[0,1,1]]", "4"], ["grid = [[2,1,1],[0,1,1],[1,0,1]]", "-1"], ["grid = [[0,2]]", "0"], ["grid = [[0,1,2]]", "1"], ["grid = [[1]]", "-1"]],
  39: [["numCourses = 2, prerequisites = [[1,0]]", "true"], ["numCourses = 2, prerequisites = [[1,0],[0,1]]", "false"], ["numCourses = 1, prerequisites = []", "true"], ["numCourses = 3, prerequisites = [[1,0],[2,1]]", "true"], ["numCourses = 3, prerequisites = [[1,0],[0,1],[2,1]]", "false"]],
  40: [["n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]", "true"], ["n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]", "false"], ["n = 1, edges = []", "true"], ["n = 4, edges = [[0,1],[2,3]]", "false"], ["n = 4, edges = [[0,1],[1,2],[2,3],[3,0]]", "false"]],
  41: [["n = 2", "2"], ["n = 3", "3"], ["n = 1", "1"], ["n = 5", "8"], ["n = 0", "1"]],
  42: [["nums = [1,2,3,1]", "4"], ["nums = [2,7,9,3,1]", "12"], ["nums = [2,1,1,2]", "4"], ["nums = [0]", "0"], ["nums = [2,7,9,3,1,5]", "14"]],
  43: [["coins = [1,2,5], amount = 11", "3"], ["coins = [2], amount = 3", "-1"], ["coins = [1], amount = 0", "0"], ["coins = [1,3,4], amount = 6", "2"], ["coins = [2,5,10,1], amount = 27", "4"]],
  44: [["nums = [10,9,2,5,3,7,101,18]", "4"], ["nums = [0,1,0,3,2,3]", "4"], ["nums = [7,7,7,7]", "1"], ["nums = [1,2,3,4]", "4"], ["nums = []", "0"]],
  45: [["s = \"leetcode\", wordDict = [\"leet\",\"code\"]", "true"], ["s = \"applepenapple\", wordDict = [\"apple\",\"pen\"]", "true"], ["s = \"catsandog\", wordDict = [\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]", "false"], ["s = \"a\", wordDict = [\"a\"]", "true"], ["s = \"cars\", wordDict = [\"car\",\"ca\",\"rs\"]", "true"]],
  46: [["m = 3, n = 7", "28"], ["m = 3, n = 2", "3"], ["m = 1, n = 1", "1"], ["m = 2, n = 2", "2"], ["m = 7, n = 3", "28"]],
  47: [["text1 = \"abcde\", text2 = \"ace\"", "3"], ["text1 = \"abc\", text2 = \"abc\"", "3"], ["text1 = \"abc\", text2 = \"def\"", "0"], ["text1 = \"\", text2 = \"abc\"", "0"], ["text1 = \"bsbininm\", text2 = \"jmjkbkjkv\"", "1"]],
  48: [["prices = [1,2,3,0,2]", "3"], ["prices = [1]", "0"], ["prices = [2,1,4]", "3"], ["prices = [1,2,4]", "3"], ["prices = [6,1,3,2,4,7]", "6"]],
  49: [["nums = [3,1,5,8]", "167"], ["nums = [1]", "1"], ["nums = [1,5]", "10"], ["nums = [3,1,5]", "35"], ["nums = [2,4,3]", "36"]],
  50: [["s = \"aa\", p = \"a\"", "false"], ["s = \"aa\", p = \"a*\"", "true"], ["s = \"ab\", p = \".*\"", "true"], ["s = \"aab\", p = \"c*a*b\"", "true"], ["s = \"mississippi\", p = \"mis*is*p*.\"", "false"]],
};

export const devaTestCases: Record<number, DevaProblemTests> = Object.fromEntries(
  Object.entries(examples).map(([number, items]) => [Number(number), {
    prompt: "Use these reference cases to check your approach. Inputs show the named function arguments; outputs show the expected result.",
    examples: items.map(([input, output]) => ({ input, output })),
  }]),
);

export const devaTestCaseCount = Object.values(devaTestCases).reduce((sum, problem) => sum + problem.examples.length, 0);
