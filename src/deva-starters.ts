// The starter code a student sees before they type anything, in one place.
// The Deva editor and scripts/build-student-repo.mjs both read this, so the file
// in a cloned repo is byte-for-byte what Submit in the app expects.
import { judgedStarter, type Language } from "./deva-judge";

export type { Language };

export const starters: Record<Language, string> = {
  JavaScript: `function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}`,
  Python: `def two_sum(nums, target):\n    seen = {}\n    for i, value in enumerate(nums):\n        need = target - value\n        if need in seen:\n            return [seen[need], i]\n        seen[value] = i\n    return []\nprint(two_sum([2, 7, 11, 15], 9))`,
  Java: `import java.util.*;\n\nclass Main {\n  static int[] twoSum(int[] nums, int target) {\n    Map<Integer, Integer> seen = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n      int need = target - nums[i];\n      if (seen.containsKey(need)) return new int[] {seen.get(need), i};\n      seen.put(nums[i], i);\n    }\n    return new int[] {};\n  }\n\n  public static void main(String[] args) {\n    System.out.println(Arrays.toString(twoSum(new int[] {2, 7, 11, 15}, 9)));\n  }\n}`,
  "C++": `#include <iostream>\n#include <unordered_map>\n#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n  unordered_map<int, int> seen;\n  for (int i = 0; i < nums.size(); i++) {\n    int need = target - nums[i];\n    if (seen.count(need)) return {seen[need], i};\n    seen[nums[i]] = i;\n  }\n  return {};\n}\n\nint main() {\n  vector<int> nums = {2, 7, 11, 15};\n  for (int index : twoSum(nums, 9)) cout << index << " ";\n  return 0;\n}`,
};

export const languages: Language[] = ["JavaScript", "Python", "Java", "C++"];
export const fileNames: Record<Language, string> = {
  JavaScript: "solution.js", Python: "solution.py", Java: "Main.java", "C++": "solution.cpp",
};

export function starterFor(
  language: Language,
  problem: { number: number; title: string } | undefined,
): string {
  // Compiled languages are judged through stdin/stdout, so their starter has to
  // read the input; JavaScript is judged by calling the function directly.
  if (problem && language !== "JavaScript") {
    const judged = judgedStarter(language, problem.number);
    if (judged) return judged;
  }
  if (!problem || problem.number === 1) return starters[language];
  const comment = language === "Python" ? `# ${problem.title}\n` : `// ${problem.title}\n`;
  if (language === "Python") return `${comment}def solution(data):\n    # Write your solution here\n    pass\n`;
  if (language === "JavaScript") return `${comment}function solution(data) {\n  // Write your solution here\n  return null;\n}\n`;
  if (language === "Java") return `${comment}class Solution {\n  public Object solve(int[] data) {\n    // Write your solution here\n    return null;\n  }\n}`;
  return `${comment}#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n  int solve(vector<int>& data) {\n    // Write your solution here\n    return 0;\n  }\n};`;
}
