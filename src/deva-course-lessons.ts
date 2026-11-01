/** Concept lessons that drive the Deva course stage, editor and AI panel. */

import { argKinds, argNames, type ArgKind } from "./deva-judge";

export type LessonStep = { active: number[]; pointers: string[]; memory: string[]; title: string; narration: string; codeLine: number };
export type Lesson = { id: string; title: string; pattern: string; complexity: string; input: number[]; code: { JavaScript: string[]; Python: string[] }; steps: LessonStep[]; goal: string; concept: string; whenToUse: string; pitfalls: string[]; practice: string };

const coreLessons: Lesson[] = [
  {
    id: "two-sum", title: "Two Sum", pattern: "Hash map", complexity: "O(n) time · O(n) space", input: [2, 7, 11, 15], goal: "Find two distinct indices whose values add up to the target.", concept: "Instead of trying every pair, keep a map of values already visited. For each value x, the only partner that can work is target − x. Check whether that complement is in the map, then store x for later. Checking before inserting prevents the current element from matching itself.", whenToUse: "Use a hash map when a problem asks for fast membership, counts, grouping, or a relationship between the current item and something seen earlier.", pitfalls: ["Inserting before checking can reuse the same index when the target is twice the current value.", "Store the information the answer needs: a value alone is not enough when the result asks for indices.", "Account for duplicates; a map may need a count or a list of indices instead of one entry."], practice: "Adapt the pattern to return every unique value pair that sums to a target.",
    code: {
      JavaScript: ["function twoSum(nums, target) {", "  const seen = new Map();", "  for (let i = 0; i < nums.length; i++) {", "    const need = target - nums[i];", "    if (seen.has(need)) return [seen.get(need), i];", "    seen.set(nums[i], i);", "  }", "}", "twoSum([2, 7, 11, 15], 9);"],
      Python: ["def two_sum(nums, target):", "    seen = {}", "    for i, value in enumerate(nums):", "        need = target - value", "        if need in seen:", "            return [seen[need], i]", "        seen[value] = i", "", "two_sum([2, 7, 11, 15], 9)"],
    },
    steps: [
      { active: [0], pointers: ["i = 0"], memory: ["seen = {}"], title: "Start with the first value", narration: "We need two numbers that add to 9. At each index, ask what partner would complete the target.", codeLine: 2 },
      { active: [0], pointers: ["i = 0"], memory: ["need = 9 − 2 = 7", "seen = {}"], title: "Look for its complement", narration: "The current value is 2, so its complement is 7. The map is empty, which means we have not seen that partner yet.", codeLine: 3 },
      { active: [0], pointers: ["i = 0"], memory: ["seen: 2 → index 0", "need 7 is not here"], title: "Remember what we passed", narration: "Store 2 with its index. This lets a later number find its partner in constant time.", codeLine: 5 },
      { active: [1], pointers: ["i = 1"], memory: ["need = 9 − 7 = 2", "seen: 2 → index 0"], title: "The next value completes the pair", narration: "Now the value is 7. Its complement is 2, and 2 is already in the map at index 0.", codeLine: 4 },
      { active: [0, 1], pointers: ["answer = [0, 1]"], memory: ["nums[0] + nums[1] = 2 + 7 = 9"], title: "Return the matching indices", narration: "We found the answer in one pass: indices 0 and 1. Each array value is visited once.", codeLine: 4 },
    ],
  },
  {
    id: "binary-search", title: "Binary Search", pattern: "Divide and conquer", complexity: "O(log n) time · O(1) space", input: [1, 3, 5, 7, 9, 11, 13], goal: "Find a target in sorted data while discarding impossible candidates.", concept: "Maintain a candidate interval that is guaranteed to contain the answer. Inspect its midpoint, then use the ordering to discard one half. The key idea is the invariant: after every boundary update, every possible answer remains inside the range.", whenToUse: "Use binary search on sorted data or on a monotonic yes/no condition, such as the smallest capacity that makes a schedule feasible.", pitfalls: ["Mixing inclusive and exclusive bounds causes off-by-one errors; choose one convention and keep it throughout.", "When moving past mid, use mid + 1 or mid − 1 so the range gets smaller.", "Binary search needs a monotonic property; an unsorted array alone does not qualify."], practice: "Return the first index whose value is greater than or equal to a target, including when the target is absent.",
    code: {
      JavaScript: ["function search(nums, target) {", "  let left = 0, right = nums.length - 1;", "  while (left <= right) {", "    const mid = Math.floor((left + right) / 2);", "    if (nums[mid] === target) return mid;", "    if (nums[mid] < target) left = mid + 1;", "    else right = mid - 1;", "  }", "  return -1;", "}", "search([1, 3, 5, 7, 9, 11, 13], 9);"],
      Python: ["def search(nums, target):", "    left, right = 0, len(nums) - 1", "    while left <= right:", "        mid = (left + right) // 2", "        if nums[mid] == target:", "            return mid", "        if nums[mid] < target:", "            left = mid + 1", "        else:", "            right = mid - 1", "    return -1", "search([1, 3, 5, 7, 9, 11, 13], 9)"],
    },
    steps: [
      { active: [0, 1, 2, 3, 4, 5, 6], pointers: ["left = 0", "right = 6"], memory: ["target = 9"], title: "Start with the full sorted range", narration: "Binary search only works on sorted data. We keep a left and right boundary around the values that could still contain 9.", codeLine: 1 },
      { active: [3], pointers: ["mid = 3"], memory: ["nums[mid] = 7", "7 < 9 → discard left half"], title: "Check the middle value", narration: "The middle value is 7. Since 7 is smaller than 9, every value at or left of the middle can be discarded.", codeLine: 3 },
      { active: [4, 5, 6], pointers: ["left = 4", "right = 6"], memory: ["remaining range = [9, 11, 13]"], title: "Shrink the search range", narration: "Move the left boundary just past the midpoint. The remaining candidates are 9, 11, and 13.", codeLine: 5 },
      { active: [5], pointers: ["mid = 5"], memory: ["nums[mid] = 11", "11 > 9 → discard right half"], title: "Check the new middle", narration: "The new midpoint is 11, which is too large. Discard 11 and everything to its right.", codeLine: 6 },
      { active: [4], pointers: ["mid = 4"], memory: ["nums[4] = 9", "target found at index 4"], title: "Find the target", narration: "The next midpoint is 9, so we return index 4. Each comparison cut the remaining range roughly in half.", codeLine: 4 },
    ],
  },
  {
    id: "sliding-window", title: "Sliding Window", pattern: "Fixed-size window", complexity: "O(n) time · O(1) space", input: [2, 1, 5, 1, 3, 2], goal: "Find the largest sum among all contiguous windows of length three.", concept: "A window represents a contiguous range. When it shifts one position, remove the outgoing value and add the incoming value. Reusing the previous sum avoids recomputing all k values for every window, reducing O(nk) work to O(n).", whenToUse: "Use a fixed window for contiguous ranges of a known size. Use a variable window when the range expands and contracts to satisfy a condition.", pitfalls: ["A window must stay contiguous; this pattern does not select arbitrary subsequences.", "Initialize the first full window before comparing later windows.", "For variable windows, confirm the validity condition is monotonic as the left edge moves; negative values can break common sum-based assumptions."], practice: "Change the walkthrough to find the minimum sum window of length three, then extend it to a variable length with sum at least a target.",
    code: {
      JavaScript: ["function maxWindowSum(nums, k) {", "  let sum = 0;", "  for (let i = 0; i < k; i++) sum += nums[i];", "  let best = sum;", "  for (let right = k; right < nums.length; right++) {", "    sum += nums[right] - nums[right - k];", "    best = Math.max(best, sum);", "  }", "  return best;", "}", "maxWindowSum([2, 1, 5, 1, 3, 2], 3);"],
      Python: ["def max_window_sum(nums, k):", "    window = sum(nums[:k])", "    best = window", "    for right in range(k, len(nums)):", "        window += nums[right] - nums[right - k]", "        best = max(best, window)", "    return best", "max_window_sum([2, 1, 5, 1, 3, 2], 3)"],
    },
    steps: [
      { active: [0, 1, 2], pointers: ["window = [0…2]"], memory: ["sum = 2 + 1 + 5 = 8", "best = 8"], title: "Build the first window", narration: "We want the largest sum of 3 consecutive values. Add the first three once to create our starting window.", codeLine: 2 },
      { active: [1, 2, 3], pointers: ["window = [1…3]"], memory: ["remove 2", "add 1", "sum = 7", "best = 8"], title: "Slide one place to the right", narration: "When the window moves, subtract the value that left and add the new value that entered. No need to sum all three again.", codeLine: 5 },
      { active: [2, 3, 4], pointers: ["window = [2…4]"], memory: ["remove 1", "add 3", "sum = 9", "best = 9"], title: "Update the best sum", narration: "The new window totals 9, which beats our previous best of 8. Save the improved answer.", codeLine: 6 },
      { active: [3, 4, 5], pointers: ["window = [3…5]"], memory: ["remove 5", "add 2", "sum = 6", "best = 9"], title: "Finish in one pass", narration: "The last window totals 6, so the best stays 9. Reusing each sum keeps the scan linear.", codeLine: 7 },
    ],
  },
  {
    id: "two-pointers", title: "Two Pointers", pattern: "Sorted arrays", complexity: "O(n) time · O(1) space", input: [1, 2, 4, 6, 8], goal: "Find two values in a sorted array that add up to 10.", concept: "Start one pointer at each end of the sorted array. If the sum is too small, move the left pointer right to increase it; if it is too large, move the right pointer left to decrease it. Each move rules out a set of pairs, so both pointers only travel across the array once.", whenToUse: "Use opposing pointers for pair or partition questions on sorted data. Use same-direction pointers for in-place compaction, deduplication, or merging.", pitfalls: ["The sorted order is what makes each pointer move safe; without it, moving a pointer can skip a valid answer.", "Move a pointer after every unsuccessful comparison to guarantee progress.", "Check whether the problem asks for values, indices, unique pairs, or all pairs; each has different duplicate handling."], practice: "Return all unique pairs whose sum is 10, even when the array contains duplicate values.",
    code: {
      JavaScript: ["function pairSum(nums, target) {", "  let left = 0, right = nums.length - 1;", "  while (left < right) {", "    const sum = nums[left] + nums[right];", "    if (sum === target) return [left, right];", "    if (sum < target) left++;", "    else right--;", "  }", "  return [];", "}", "pairSum([1, 2, 4, 6, 8], 10);"],
      Python: ["def pair_sum(nums, target):", "    left, right = 0, len(nums) - 1", "    while left < right:", "        total = nums[left] + nums[right]", "        if total == target:", "            return [left, right]", "        if total < target:", "            left += 1", "        else:", "            right -= 1", "    return []", "pair_sum([1, 2, 4, 6, 8], 10)"],
    },
    steps: [
      { active: [0, 4], pointers: ["left = 0", "right = 4"], memory: ["1 + 8 = 9", "9 < 10 → move left"], title: "Compare the outside values", narration: "The array is sorted. The smallest and largest values total 9, which is too small, so no pair using 1 can reach 10 with a value to its right.", codeLine: 5 },
      { active: [1, 4], pointers: ["left = 1", "right = 4"], memory: ["2 + 8 = 10", "target found"], title: "Move the left pointer", narration: "Move left to 2. The sum is now exactly 10, so these two indices are the answer.", codeLine: 4 },
    ],
  },
  {
    id: "stack", title: "Stack", pattern: "Last in, first out", complexity: "O(n) time · O(n) space", input: [40, 30, 20, 10], goal: "Reverse a sequence by pushing each value and popping them back out.", concept: "A stack only exposes its top. Push adds an item there; pop removes that same item. Because the newest item leaves first (LIFO), pushing a sequence and then popping it naturally reverses the order.", whenToUse: "Use a stack for nested structures, undo history, expression parsing, depth-first search, and problems involving the most recent unmatched item.", pitfalls: ["Check for an empty stack before reading or popping its top.", "The top changes after each push or pop; update it before reasoning about the next operation.", "A stack is not a queue: it cannot efficiently remove the oldest item."], practice: "Use a stack to check whether a string of parentheses and brackets is correctly nested.",
    code: {
      JavaScript: ["function reverse(values) {", "  const stack = [];", "  for (const value of values) stack.push(value);", "  const result = [];", "  while (stack.length) result.push(stack.pop());", "  return result;", "}", "reverse([40, 30, 20, 10]);"],
      Python: ["def reverse(values):", "    stack = []", "    for value in values:", "        stack.append(value)", "    result = []", "    while stack:", "        result.append(stack.pop())", "    return result", "reverse([40, 30, 20, 10])"],
    },
    steps: [
      { active: [0, 1, 2, 3], pointers: ["push each value"], memory: ["stack = [40, 30, 20, 10]", "top = 10"], title: "Push values onto the stack", narration: "Each new value goes on top. The last value pushed is now the first one available to remove.", codeLine: 2 },
      { active: [3], pointers: ["top → 10"], memory: ["pop 10", "result = [10]"], title: "Pop the top value", narration: "Remove 10 first, even though it was added last. This last-in, first-out rule creates the reversed order.", codeLine: 4 },
      { active: [2], pointers: ["top → 20"], memory: ["pop 20", "result = [10, 20]"], title: "Continue until empty", narration: "The next top is 20. Repeat until every item has moved to the result.", codeLine: 4 },
      { active: [0, 1, 2, 3], pointers: ["stack = empty"], memory: ["result = [10, 20, 30, 40]"], title: "Read the reversed sequence", narration: "The stack is empty and the result is reversed. Each value was pushed once and popped once.", codeLine: 5 },
    ],
  },
];

const curriculum: Lesson[] = [
  {
    id: "container", title: "Container With Most Water", pattern: "Converging pointers", complexity: "O(n) time · O(1) space", input: [1, 8, 6, 2, 5, 4, 8, 3, 7], goal: "Pick two lines that together hold the largest amount of water.", concept: "Area is width times the shorter line. Start with the widest pair and move the pointer on the shorter side: keeping the taller line is the only way a narrower pair can still beat the record. Every step discards a line that can never be part of a better answer, so one pass is enough.", whenToUse: "Use converging pointers when the value depends on the distance between two ends and on an ordering that lets you rule out one side safely.", pitfalls: ["Moving the taller side can never help: the height is already capped by the shorter line and the width only shrinks.", "Area uses the minimum of the two heights, not the maximum.", "Returning on the first matching pair misses the global best; keep scanning until the pointers meet."], practice: "Return the pair of indices instead of the area, then allow using the same line twice.",
    code: {
      JavaScript: ["function maxArea(height) {", "  let left = 0, right = height.length - 1;", "  let best = 0;", "  while (left < right) {", "    const area = (right - left) * Math.min(height[left], height[right]);", "    best = Math.max(best, area);", "    if (height[left] < height[right]) left++;", "    else right--;", "  }", "  return best;", "}", "maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]);"],
      Python: ["def max_area(height):", "    left, right = 0, len(height) - 1", "    best = 0", "    while left < right:", "        area = (right - left) * min(height[left], height[right])", "        best = max(best, area)", "        if height[left] < height[right]:", "            left += 1", "        else:", "            right -= 1", "    return best", "", "max_area([1, 8, 6, 2, 5, 4, 8, 3, 7])"],
    },
    steps: [
      { active: [0, 8], pointers: ["left = 0", "right = 8"], memory: ["width = 8", "min(1, 7) = 1", "area = 8"], title: "Open with the widest pair", narration: "Start at both ends. The width is maximal here, but the water is limited by the shorter wall, which is 1.", codeLine: 4 },
      { active: [1, 8], pointers: ["left = 1", "right = 8"], memory: ["left wall 1 was shorter", "width = 7", "area = 7"], title: "Move the shorter side", narration: "The left line is the bottleneck, so it moves inward. The pair it leaves behind can never hold more water, which is what makes skipping it safe.", codeLine: 6 },
      { active: [1, 7], pointers: ["right = 7"], memory: ["min(8, 3) = 3", "width = 6", "area = 18"], title: "Now the right side is shorter", narration: "With 8 on the left and 3 on the right, the right line becomes the bottleneck, so the right pointer steps in.", codeLine: 7 },
      { active: [1, 4], pointers: ["left = 1", "right = 4"], memory: ["min(8, 5) = 5", "width = 3", "area = 15"], title: "Chase the taller walls", narration: "The best area so far came from a wide span and a mid-height wall. Narrowing further only pays off if the shorter wall grows.", codeLine: 5 },
      { active: [1, 8], pointers: ["best = 49"], memory: ["min(8, 7) = 7", "width = 7", "7 × 7 = 49"], title: "Record beats the widest span", narration: "Lines at index 1 and 8 hold 49 - more than any wider pair, because both walls are tall. The pointers have now crossed, so the scan is done.", codeLine: 5 },
    ],
  },
  {
    id: "prefix-product", title: "Product Except Self", pattern: "Prefix & suffix passes", complexity: "O(n) time · O(1) extra space", input: [1, 2, 3, 4], goal: "Replace every element with the product of all the others, without division.", concept: "The answer for an index is the product of everything to its left times everything to its right. Sweep left to right writing running prefix products into the output, then sweep right to left multiplying in the running suffix. Two linear passes replace the O(n squared) nested loop, and no division means zeros stop being special.", whenToUse: "Use prefix and suffix passes whenever each output depends on the whole array split at the current index: products, sums, ranges, or counts on both sides.", pitfalls: ["Initialise both running products to 1, not 0 - 0 is the identity for multiplication.", "Writing the prefix into the answer array first is what makes the extra space O(1).", "A single pass cannot see the right-hand side, so the second pass is not optional."], practice: "Do the same for sums, then extend it to answer closed-range product queries with a division guard.",
    code: {
      JavaScript: ["function productExceptSelf(nums) {", "  const answer = new Array(nums.length).fill(1);", "  let left = 1;", "  for (let i = 0; i < nums.length; i++) {", "    answer[i] = left;", "    left *= nums[i];", "  }", "  let right = 1;", "  for (let i = nums.length - 1; i >= 0; i--) {", "    answer[i] *= right;", "    right *= nums[i];", "  }", "  return answer;", "}", "productExceptSelf([1, 2, 3, 4]);"],
      Python: ["def product_except_self(nums):", "    answer = [1] * len(nums)", "    left = 1", "    for i, value in enumerate(nums):", "        answer[i] = left", "        left *= value", "    right = 1", "    for i in range(len(nums) - 1, -1, -1):", "        answer[i] *= right", "        right *= nums[i]", "    return answer", "", "product_except_self([1, 2, 3, 4])"],
    },
    steps: [
      { active: [], pointers: ["left = 1"], memory: ["answer = [1, 1, 1, 1]"], title: "Start with the empty product", narration: "Every cell begins at 1, the identity for multiplication, ready to receive the product of the numbers on its left.", codeLine: 1 },
      { active: [0, 1], pointers: ["i = 1"], memory: ["answer[1] = 1", "left = 1 × 2 = 2"], title: "Carry the running prefix", narration: "At index 1 the prefix is 1 - only the first value sits to the left. Then 2 joins the running product.", codeLine: 4 },
      { active: [0, 1, 2], pointers: ["i = 2"], memory: ["answer = [1, 1, 2, 6]", "left = 6"], title: "The prefix grows with each step", narration: "Index 2 stores 1 × 2 and index 3 will store 1 × 2 × 3. One pass, no inner loop.", codeLine: 4 },
      { active: [3], pointers: ["i = 3", "right = 1"], memory: ["answer[3] = 6 × 1 = 6"], title: "Sweep back with the suffix", narration: "Now walk right to left. The right-hand product starts at 1, so the last cell keeps its prefix value as its final answer.", codeLine: 9 },
      { active: [0, 1, 2, 3], pointers: ["done"], memory: ["answer = [24, 12, 8, 6]"], title: "Every cell is prefix times suffix", narration: "Multiplying the two running products into each other finishes the array in linear time, and division never appears.", codeLine: 12 },
    ],
  },
  {
    id: "kadane", title: "Maximum Subarray", pattern: "Kadane / running best", complexity: "O(n) time · O(1) space", input: [2, -1, 3, -4, 5], goal: "Find the largest sum over any contiguous slice of the array.", concept: "At each index only two things matter: extend the run that ended at the previous index, or abandon it and start fresh here. Keep the better of those as the current run, and the best run seen anywhere as the answer. Because every subarray ends somewhere, the maximum over all ending positions is the maximum overall.", whenToUse: "Use Kadane for contiguous range optimums on numbers, and keep a parallel array of ending indices when the problem also wants the slice itself.", pitfalls: ["Initialise both the current run and the best from the first element, not from 0, or an all-negative array reports 0.", "Reset means current = value, not current = 0.", "This measures contiguous subarrays; a subsequence or a set of elements is a different problem."], practice: "Return the start and end indices of the winning slice, then the minimum-sum slice.",
    code: {
      JavaScript: ["function maxSubArray(nums) {", "  let current = nums[0];", "  let best = nums[0];", "  for (let i = 1; i < nums.length; i++) {", "    current = Math.max(nums[i], current + nums[i]);", "    best = Math.max(best, current);", "  }", "  return best;", "}", "maxSubArray([2, -1, 3, -4, 5]);"],
      Python: ["def max_sub_array(nums):", "    current = best = nums[0]", "    for value in nums[1:]:", "        current = max(value, current + value)", "        best = max(best, current)", "    return best", "", "max_sub_array([2, -1, 3, -4, 5])"],
    },
    steps: [
      { active: [0], pointers: ["i = 0"], memory: ["current = 2", "best = 2"], title: "Seed from the first element", narration: "Both the running slice and the answer start at index 0. Starting at 0 instead would silently allow an empty slice.", codeLine: 1 },
      { active: [1], pointers: ["i = 1"], memory: ["max(-1, 2 + -1) = 1", "current = 1"], title: "Extend, or restart?", narration: "Adding -1 to the run still beats taking -1 alone, so the slice [2, -1] survives with sum 1.", codeLine: 4 },
      { active: [2], pointers: ["i = 2"], memory: ["max(3, 1 + 3) = 4", "best = 4"], title: "A positive value always extends", narration: "3 on its own is worse than the run plus 3, so the run continues and sets a new best of 4.", codeLine: 5 },
      { active: [3], pointers: ["i = 3"], memory: ["max(-4, 4 + -4) = 0", "current = 0"], title: "The dip is absorbed", narration: "The -4 drags the run down to 0. The run is kept because a later positive may still make it worth more than starting over.", codeLine: 4 },
      { active: [4], pointers: ["i = 4"], memory: ["max(5, 0 + 5) = 5", "best = 5"], title: "Best run ending anywhere", narration: "The final extension gives 5, which beats 4. Taking the maximum over every ending position is the whole proof.", codeLine: 5 },
    ],
  },
  {
    id: "koko", title: "Koko Eating Bananas", pattern: "Binary search on the answer", complexity: "O(n log m) time · O(1) space", input: [3, 6, 7, 11], goal: "Find the smallest speed that finishes every pile within the given hours.", concept: "The array is not sorted - the answer space is. Feasibility is monotone in speed: if a speed works, every faster speed works too. So binary search over speeds from 1 to the largest pile, testing each candidate by summing the ceiling of pile over speed. The first feasible speed is the minimum.", whenToUse: "Search the answer instead of the array when a candidate can be checked in linear time and feasibility only turns from false to true as the candidate grows: capacities, rates, minimum maximums.", pitfalls: ["Ceiling division matters: a pile of 7 at speed 3 costs 3 hours, not 2.", "The range is [1, max(piles)]; a speed above the largest pile wastes hours without helping.", "Returning left requires the invariant that every value below left is known to be infeasible."], practice: "Solve the same shape for the ships-within-days capacity problem.",
    code: {
      JavaScript: ["function minEatingSpeed(piles, h) {", "  const hours = (k) => piles.reduce((sum, pile) => sum + Math.ceil(pile / k), 0);", "  let left = 1, right = Math.max(...piles);", "  while (left < right) {", "    const mid = Math.floor((left + right) / 2);", "    if (hours(mid) <= h) right = mid;", "    else left = mid + 1;", "  }", "  return left;", "}", "minEatingSpeed([3, 6, 7, 11], 8);"],
      Python: ["def min_eating_speed(piles, h):", "    def hours(k):", "        return sum(-(-pile // k) for pile in piles)", "    left, right = 1, max(piles)", "    while left < right:", "        mid = (left + right) // 2", "        if hours(mid) <= h:", "            right = mid", "        else:", "            left = mid + 1", "    return left", "", "min_eating_speed([3, 6, 7, 11], 8)"],
    },
    steps: [
      { active: [0, 1, 2, 3], pointers: ["left = 1", "right = 11"], memory: ["candidate speed range [1, 11]", "h = 8"], title: "Search the speed, not the piles", narration: "Every speed from 1 to the biggest pile is a candidate. Half of them are impossible, and impossibility comes in one unbroken block.", codeLine: 2 },
      { active: [1, 2, 3], pointers: ["mid = 6"], memory: ["ceil(3/6) + ceil(6/6) + ceil(7/6) + ceil(11/6)", "= 1 + 1 + 2 + 2 = 6 hours", "6 <= 8 → feasible"], title: "Test the middle speed", narration: "At speed 6 the piles cost 6 hours, inside the limit. So 6 works and so does everything above it - the answer is 6 or smaller.", codeLine: 6 },
      { active: [], pointers: ["right = 6"], memory: ["range now [1, 6]"], title: "Collapse the feasible half", narration: "Keep 6 as a live candidate - it may itself be the minimum - and throw away everything strictly above it.", codeLine: 6 },
      { active: [3], pointers: ["mid = 3"], memory: ["1 + 2 + 3 + 4 = 10 hours", "10 > 8 → too slow"], title: "Too slow on the left", narration: "Speed 3 costs 10 hours, so every speed at or below 3 also fails. The lower boundary jumps past the whole failed block at once.", codeLine: 7 },
      { active: [2], pointers: ["left = 4", "right = 4"], memory: ["hours(4) = 1 + 2 + 2 + 3 = 8 ≤ 8"], title: "Boundaries meet on the minimum", narration: "Speed 4 finishes in exactly 8 hours and speed 3 does not, so 4 is the smallest feasible rate.", codeLine: 9 },
    ],
  },
  {
    id: "stock", title: "Best Time to Buy and Sell Stock", pattern: "Running minimum", complexity: "O(n) time · O(1) space", input: [7, 1, 5, 3, 6, 4], goal: "Take one buy and one later sell for the largest possible profit.", concept: "Rewrite the question as: for each day as the sell day, what was the cheapest buy before it? Track only the lowest price seen so far and the best profit so far. That collapses O(n squared) pairs into one pass, because a price that is not the cheapest so far can never be the better buy.", whenToUse: "Use a running minimum or maximum when each position needs the best partner from one side only - profit, drawdown, span, or distance problems.", pitfalls: ["Update the low before the profit, or after - but decide which, or a same-day buy and sell sneaks in.", "If no profitable trade exists the answer is 0, not a negative number.", "A single pass cannot answer multiple transactions; that needs a different state."], practice: "Allow at most two transactions and see how much state that costs.",
    code: {
      JavaScript: ["function maxProfit(prices) {", "  let low = Infinity, best = 0;", "  for (const price of prices) {", "    low = Math.min(low, price);", "    best = Math.max(best, price - low);", "  }", "  return best;", "}", "maxProfit([7, 1, 5, 3, 6, 4]);"],
      Python: ["def max_profit(prices):", "    low = float(\"inf\")", "    best = 0", "    for price in prices:", "        low = min(low, price)", "        best = max(best, price - low)", "    return best", "", "max_profit([7, 1, 5, 3, 6, 4])"],
    },
    steps: [
      { active: [0], pointers: ["low = 7"], memory: ["best = 0"], title: "Buy at the first price you see", narration: "The candidate buy is 7. Selling on the same day is 0 profit, which is the floor for best.", codeLine: 3 },
      { active: [1], pointers: ["low = 1"], memory: ["price - low = 0", "best = 0"], title: "A cheaper day replaces the buy", narration: "1 is below 7, so the buy moves here. Any sell after this point starts from a cheaper entry.", codeLine: 3 },
      { active: [2], pointers: ["sell at 5"], memory: ["5 - 1 = 4", "best = 4"], title: "Sell against the cheapest buy", narration: "Selling at 5 makes 4. The buy stays at 1 because nothing since has been cheaper.", codeLine: 4 },
      { active: [4], pointers: ["sell at 6"], memory: ["6 - 1 = 5", "best = 5"], title: "The peak sets the record", narration: "6 is the best sell day paired with the 1 buy: 5 profit. Only two numbers were ever remembered.", codeLine: 4 },
      { active: [0, 1, 2, 3, 4, 5], pointers: ["done"], memory: ["best = 5", "one pass, six prices"], title: "Every pair never had to be tried", narration: "Fifteen pairs collapse to six comparisons because a price that is not the low so far cannot improve the answer.", codeLine: 7 },
    ],
  },
  {
    id: "top-k", title: "Top K Frequent Elements", pattern: "Count, then order", complexity: "O(n + k log n) time · O(n) space", input: [1, 1, 1, 2, 2, 3], goal: "Return the k values that appear most often.", concept: "Counting is free with a hash map: one pass turns the array into value-to-count pairs. Ordering only needs to happen over the distinct values, which are at most n, so the sort costs k log n on a much smaller set than the raw array. The frequency is never compared to an index - that is the whole separation of concerns.", whenToUse: "Use a frequency map whenever the question is about how often something appears: top k, first unique, anagram checks, or duplicates.", pitfalls: ["Sorting the values instead of the counts is the classic wrong turn.", "Ties are allowed by most specs; decide explicitly whether equal counts keep input order.", "Counting with a nested loop over the array is O(n squared) for what one map does in O(n)."], practice: "Do it in O(n) with a bucket array indexed by count, and return the k most frequent in any order.",
    code: {
      JavaScript: ["function topKFrequent(nums, k) {", "  const count = new Map();", "  for (const value of nums) count.set(value, (count.get(value) ?? 0) + 1);", "  const entries = [...count.entries()];", "  entries.sort((a, b) => b[1] - a[1]);", "  return entries.slice(0, k).map((entry) => entry[0]);", "}", "topKFrequent([1, 1, 1, 2, 2, 3], 2);"],
      Python: ["def top_k_frequent(nums, k):", "    counts = {}", "    for value in nums:", "        counts[value] = counts.get(value, 0) + 1", "    ranked = sorted(counts.items(), key=lambda pair: -pair[1])", "    return [value for value, _ in ranked[:k]]", "", "top_k_frequent([1, 1, 1, 2, 2, 3], 2)"],
    },
    steps: [
      { active: [0], pointers: ["scan i = 0"], memory: ["count: {1: 1}"], title: "One pass to count", narration: "Read each value once and keep a tally in a hash map. Insertion and lookup are constant time, which is why counting is cheap.", codeLine: 2 },
      { active: [0, 1, 2], pointers: ["scan i = 2"], memory: ["count: {1: 3, 2: 1}"], title: "The tally only grows", narration: "Three 1s means 1 maps to 3. The map holds one entry per distinct value, not one per array cell.", codeLine: 2 },
      { active: [3, 4], pointers: ["scan i = 4"], memory: ["count: {1: 3, 2: 2, 3: 1}"], title: "Distinct values are the real input", narration: "Six numbers collapse to three keys. Everything that follows costs time proportional to the keys.", codeLine: 2 },
      { active: [], pointers: ["sort"], memory: ["ranked: [1×3, 2×2, 3×1]"], title: "Order by count, descending", narration: "Sorting the pairs by frequency puts the winners at the front. A heap capped at k would do the same work in less space.", codeLine: 4 },
      { active: [0, 3], pointers: ["k = 2"], memory: ["answer = [1, 2]"], title: "Take the first k", narration: "Slicing off the top two keys finishes it: 1 appears three times, 2 appears twice.", codeLine: 5 },
    ],
  },
  {
    id: "temperatures", title: "Daily Temperatures", pattern: "Monotonic stack", complexity: "O(n) time · O(n) space", input: [73, 74, 75, 71, 69, 72, 76, 73], goal: "For each day, count the days until a warmer temperature.", concept: "Keep the days still waiting for a warmer one in a stack of indices, temperatures decreasing. When a new day is warmer than the top, it answers every day it pops - and the distance is the index difference. Each index is pushed once and popped once, so the total work is linear even though there is a while loop inside the for loop.", whenToUse: "Use a monotonic stack for next-greater, next-smaller, spans, or anything asking how far a value dominates its neighbours.", pitfalls: ["Store indices, not values, or the day count cannot be computed.", "The stack must stay monotonic after every push, or the invariant breaks.", "Amortised analysis is the point: the inner loop is bounded by total pops, not by n per iteration."], practice: "Same shape for next greater element to the right, then for the largest rectangle in a histogram.",
    code: {
      JavaScript: ["function dailyTemperatures(temperatures) {", "  const answer = new Array(temperatures.length).fill(0);", "  const stack = [];", "  for (let i = 0; i < temperatures.length; i++) {", "    while (stack.length && temperatures[i] > temperatures[stack[stack.length - 1]]) {", "      const from = stack.pop();", "      answer[from] = i - from;", "    }", "    stack.push(i);", "  }", "  return answer;", "}", "dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]);"],
      Python: ["def daily_temperatures(temperatures):", "    answer = [0] * len(temperatures)", "    stack = []", "    for i, value in enumerate(temperatures):", "        while stack and value > temperatures[stack[-1]]:", "            from_index = stack.pop()", "            answer[from_index] = i - from_index", "        stack.append(i)", "    return answer", "", "daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73])"],
    },
    steps: [
      { active: [0], pointers: ["push 0"], memory: ["stack = [0] (73)", "answer = [0, ...]"], title: "Park the first day", narration: "Day 0 has no answer yet, so it waits on the stack. Everything on the stack is colder than the day below it.", codeLine: 8 },
      { active: [1], pointers: ["pop 0", "push 1"], memory: ["74 > 73 → answer[0] = 1", "stack = [1]"], title: "A warmer day settles the stack", narration: "74 beats the 73 on top, so day 0 gets its distance: one day. The stack keeps only unanswered days.", codeLine: 5 },
      { active: [4], pointers: ["push 4"], memory: ["stack = [2, 3, 4] (75, 71, 69)"], title: "Cold days pile up", narration: "Nothing warmer has arrived, so three days wait. The stack is decreasing from bottom to top, which is the invariant that makes popping correct.", codeLine: 8 },
      { active: [6], pointers: ["pop 4", "pop 3", "pop 2"], memory: ["76 answers 69, 71, 75", "answer[2] = 4, answer[3] = 3, answer[4] = 2"], title: "One hot day drains the stack", narration: "76 is warmer than everything waiting, so it pops three days in one step. Those pops are the work already paid for by the pushes.", codeLine: 5 },
      { active: [0, 1, 2, 3, 4, 5, 6, 7], pointers: ["done"], memory: ["[1, 1, 4, 2, 1, 1, 0, 0]"], title: "Linear, with a loop inside a loop", narration: "Two days stay at 0 because no warmer day ever came. Eight pushes, eight pops at most - O(n) total.", codeLine: 10 },
    ],
  },
  {
    id: "queue", title: "Circular Queue", pattern: "Wrap-around indices", complexity: "O(1) per operation · O(capacity) space", input: [1, 2, 3, 4, 5], goal: "Keep first-in-first-out order while reusing the freed slots of a fixed array.", concept: "Head and tail are indices that wrap with modulo instead of running off the end. Size, not head equals tail, is what distinguishes full from empty. Enqueue writes at tail and moves it forward; dequeue reads at head and moves it forward; freed cells get overwritten on the next lap.", whenToUse: "Use a circular buffer for fixed-capacity streams: BFS levels, sliding windows, producer-consumer rings, or any queue that must not allocate.", pitfalls: ["Without a separate size, full and empty look identical and one element is silently lost.", "Wrap with modulo on both pointers; forgetting the tail wrap writes out of bounds.", "A linked-list queue is O(1) too, but it allocates a node per element."], practice: "Drop the size counter and keep capacity - 1 free slots instead, the classic no-size ring.",
    code: {
      JavaScript: ["function drain(values) {", "  const cap = Math.max(1, values.length);", "  const ring = new Array(cap).fill(0);", "  let head = 0, tail = 0, size = 0;", "  const out = [];", "  const enqueue = (value) => { if (size === cap) return; ring[tail] = value; tail = (tail + 1) % cap; size++; };", "  const dequeue = () => { if (!size) return; out.push(ring[head]); head = (head + 1) % cap; size--; };", "  for (const value of values.slice(0, 3)) enqueue(value);", "  dequeue(); dequeue();", "  for (const value of values.slice(3)) enqueue(value);", "  while (size) dequeue();", "  return out;", "}", "drain([1, 2, 3, 4, 5]);"],
      Python: ["def drain(values):", "    cap = max(1, len(values))", "    ring = [0] * cap", "    head = tail = size = 0", "    out = []", "    def enqueue(value):", "        nonlocal tail, size", "        if size == cap:", "            return", "        ring[tail] = value", "        tail = (tail + 1) % cap", "        size += 1", "    def dequeue():", "        nonlocal head, size", "        if not size:", "            return", "        out.append(ring[head])", "        head = (head + 1) % cap", "        size -= 1", "    for value in values[:3]:", "        enqueue(value)", "    dequeue()", "    dequeue()", "    for value in values[3:]:", "        enqueue(value)", "    while size:", "        dequeue()", "    return out", "", "drain([1, 2, 3, 4, 5])"],
    },
    steps: [
      { active: [0, 1, 2], pointers: ["head = 0", "tail = 3"], memory: ["ring = [1, 2, 3]", "size = 3"], title: "Fill to capacity", narration: "Three enqueues fill all five slots used so far. Tail points at the next free cell, not the last written one.", codeLine: 7 },
      { active: [3, 4], pointers: ["head = 2"], memory: ["out = [1, 2]", "size = 1", "freed: cells 0 and 1"], title: "Two dequeues open a gap", narration: "1 and 2 leave in the order they arrived. Their cells are now free while the tail is still at index 3.", codeLine: 8 },
      { active: [], pointers: ["tail = 4"], memory: ["ring = [4, 2, 3]"], title: "Reuse from the front", narration: "The next enqueue lands on index 0, not index 3. That is the wrap: the buffer is a ring, not a line.", codeLine: 9 },
      { active: [0], pointers: ["tail = 0"], memory: ["ring = [4, 5, 3]", "size = 3"], title: "Tail comes back around", narration: "After writing index 1 the tail passes the end and returns to 0, ready for the next lap.", codeLine: 9 },
      { active: [0, 1, 2, 3, 4], pointers: ["head = tail"], memory: ["out = [1, 2, 3, 4, 5]", "size = 0"], title: "FIFO survives the wrap", narration: "Draining everything yields the arrival order unchanged. The modulo moved the indices; it never moved the semantics.", codeLine: 11 },
    ],
  },
  {
    id: "bst-insert", title: "Binary Search Tree Insert", pattern: "Ordered tree", complexity: "O(log n) average · O(n) worst", input: [5, 3, 8, 1, 4, 7, 9], goal: "Insert values in arrival order and prove the tree comes out sorted.", concept: "Every node carries an invariant: everything below and to the left is smaller, everything to the right is larger. Inserting walks down from the root choosing left or right by comparison until it hits a hole. An inorder walk - left, self, right - therefore reads the values in ascending order, which is the tree's whole value proposition.", whenToUse: "Use a BST when you need ordered traversal, range queries, or predecessor and successor alongside insert and delete. Reach for a self-balancing variant when input order is adversarial.", pitfalls: ["Sorted input degenerates the tree into a linked list; height is only logarithmic on average.", "Decide the equal-key rule - left, right or count - and use it consistently.", "A recursive insert that forgets to reassign the child link silently drops the subtree."], practice: "Count the comparisons per insert, then delete a node with two children by swapping in the inorder successor.",
    code: {
      JavaScript: ["function insertOrder(values) {", "  let root = null;", "  const insert = (node, value) => {", "    if (!node) return { value, left: null, right: null };", "    if (value < node.value) node.left = insert(node.left, value);", "    else node.right = insert(node.right, value);", "    return node;", "  };", "  for (const value of values) root = insert(root, value);", "  const out = [];", "  const walk = (node) => { if (!node) return; walk(node.left); out.push(node.value); walk(node.right); };", "  walk(root);", "  return out;", "}", "insertOrder([5, 3, 8, 1, 4, 7, 9]);"],
      Python: ["def insert_order(values):", "    root = None", "    def insert(node, value):", "        if node is None:", "            return {\"value\": value, \"left\": None, \"right\": None}", "        if value < node[\"value\"]:", "            node[\"left\"] = insert(node[\"left\"], value)", "        else:", "            node[\"right\"] = insert(node[\"right\"], value)", "        return node", "    for value in values:", "        root = insert(root, value)", "    out = []", "    def walk(node):", "        if node is None:", "            return", "        walk(node[\"left\"])", "        out.append(node[\"value\"])", "        walk(node[\"right\"])", "    walk(root)", "    return out", "", "insert_order([5, 3, 8, 1, 4, 7, 9])"],
    },
    steps: [
      { active: [0], pointers: ["root = 5"], memory: ["tree: 5"], title: "The first value is the root", narration: "There is no invariant to check yet. Everything smaller ends up left, everything larger right.", codeLine: 8 },
      { active: [1], pointers: ["1 < 5"], memory: ["tree: 5 ← 3"], title: "Compare your way down", narration: "3 is smaller than 5, so it takes the left hole one level below. Two comparisons, one link created.", codeLine: 4 },
      { active: [2], pointers: ["8 > 5"], memory: ["tree: 3 → 5 ← 8"], title: "Larger values go right", narration: "8 is bigger than the root, so it lands on the right. The ordering at every node is what an inorder walk reads back.", codeLine: 5 },
      { active: [3, 4], pointers: ["1 < 5, 1 < 3", "4 > 3"], memory: ["leaves: 1, 4, 7, 9"], title: "Descend before you attach", narration: "1 and 4 pass through 5 first and then split at 3. Depth grows with the number of comparisons, which is why balance matters.", codeLine: 4 },
      { active: [0, 1, 2, 3, 4, 5, 6], pointers: ["inorder"], memory: ["[1, 3, 4, 5, 7, 8, 9]"], title: "Inorder reads it sorted", narration: "Left, self, right returns ascending values for free. The sort happened during insertion, one comparison at a time.", codeLine: 12 },
    ],
  },
  {
    id: "climbing", title: "Climbing Stairs", pattern: "Recursion to DP", complexity: "O(n) time · O(1) space", input: [1, 1, 2, 3, 5, 8], goal: "Count the distinct ways to reach the top taking one or two steps at a time.", concept: "The last move is either one step from n - 1 or two steps from n - 2, and those sets never overlap, so ways(n) = ways(n - 1) + ways(n - 2). Written as plain recursion the same subproblem is solved over and over; memoising collapses it to linear. Keeping only the previous two values drops the space to constant.", whenToUse: "Use this ladder whenever a state depends on a fixed number of earlier states: tilings, decode counts, hop problems, and any recurrence with small history.", pitfalls: ["Naive recursion is exponential because branches re-solve identical subproblems.", "Base cases define the answer: f(0) = 1 and f(1) = 1, not f(1) = 1 and f(2) = 2 by accident.", "Overwriting the previous value before reading it breaks the rolling window."], practice: "Generalise to steps of 1, 2 or 3, then to a cost array with minimum cost climbing.",
    code: {
      JavaScript: ["function climbStairs(n) {", "  let previous = 1, current = 1;", "  for (let i = 2; i <= n; i++) {", "    const next = previous + current;", "    previous = current;", "    current = next;", "  }", "  return current;", "}", "climbStairs(5);"],
      Python: ["def climb_stairs(n):", "    previous = current = 1", "    for _ in range(2, n + 1):", "        previous, current = current, previous + current", "    return current", "", "climb_stairs(5)"],
    },
    steps: [
      { active: [0, 1], pointers: ["f(0) = 1", "f(1) = 1"], memory: ["ways so far: 1, 1"], title: "Two base cases, both one way", narration: "Standing on the ground is one way to be there, and one step is one way. Everything else is built from these.", codeLine: 1 },
      { active: [2], pointers: ["i = 2"], memory: ["f(2) = 1 + 1 = 2"], title: "Each step sums the last two", narration: "Reach step 2 from step 1 or step 0. The two routes are disjoint, so they add rather than overlap.", codeLine: 3 },
      { active: [3], pointers: ["i = 3"], memory: ["f(3) = 1 + 2 = 3"], title: "The window rolls forward", narration: "Only the previous two values are ever read, so the whole table can be replaced by a sliding pair.", codeLine: 4 },
      { active: [4], pointers: ["i = 4"], memory: ["f(4) = 2 + 3 = 5"], title: "It is Fibonacci, deliberately", narration: "Any recurrence over a fixed history is Fibonacci-shaped. Naming that is what makes the pattern transfer.", codeLine: 5 },
      { active: [5], pointers: ["i = 5"], memory: ["f(5) = 3 + 5 = 8", "space = O(1)"], title: "Linear time, constant memory", narration: "Five additions instead of the 25 calls a bare recursion makes at n = 5. At n = 40 the gap is from millions to forty.", codeLine: 5 },
    ],
  },
  {
    id: "robber", title: "House Robber", pattern: "Take or skip DP", complexity: "O(n) time · O(1) space", input: [1, 2, 3, 1], goal: "Maximise the loot without robbing two adjacent houses.", concept: "Two states carry the best answer so far: rob this house, which must add onto the best that skipped the previous one, or skip it and keep the previous best. The recurrence is new = max(skip, rob + value). Because each decision only looks one house back, the whole table reduces to two rolling numbers.", whenToUse: "Use take-or-skip DP for sequences with a no-adjacent constraint, and its circular cousin for problems where first and last choices conflict.", pitfalls: ["Choosing the larger value greedily fails: [1, 2, 3, 1] shows the best pair is 2 + 3, not 3 + 1.", "Two separate cases are needed when the street is circular, and each must forbid one end.", "Updating the best before reading the previous state corrupts the rolling window."], practice: "Solve the circular version, then the tree variant where you cannot rob a node and its parent.",
    code: {
      JavaScript: ["function rob(nums) {", "  let skip = 0, take = 0;", "  for (const value of nums) {", "    const next = Math.max(skip, take + value);", "    take = skip;", "    skip = next;", "  }", "  return Math.max(skip, take);", "}", "rob([1, 2, 3, 1]);"],
      Python: ["def rob(nums):", "    skip = take = 0", "    for value in nums:", "        skip, take = max(skip, take + value), skip", "    return max(skip, take)", "", "rob([1, 2, 3, 1])"],
    },
    steps: [
      { active: [0], pointers: ["value = 1"], memory: ["skip = 1", "take = 0"], title: "Two states, one per decision", narration: "skip is the best total where the last house was left alone; take is the best where it was robbed. Both start empty.", codeLine: 3 },
      { active: [1], pointers: ["value = 2"], memory: ["max(1, 0 + 2) = 2", "skip = 2", "take = 1"], title: "Robbing forces the previous skip", narration: "Robbing house 1 can only build on the state that skipped house 0. That single dependency is the adjacency rule.", codeLine: 3 },
      { active: [2], pointers: ["value = 3"], memory: ["max(2, 1 + 3) = 4", "skip = 4", "take = 2"], title: "The best so far jumps", narration: "1 + 3 beats the 2 held by skip, so the answer at this point is 4 with houses 0 and 2 robbed.", codeLine: 4 },
      { active: [3], pointers: ["value = 1"], memory: ["max(4, 2 + 1) = 4"], title: "A bad house changes nothing", narration: "Adding 1 to the take state gives 3, still short of 4, so skip carries the record forward untouched.", codeLine: 3 },
      { active: [0, 1, 2, 3], pointers: ["answer = 4"], memory: ["rob houses 0 and 2", "two numbers held, not a table"], title: "Best of both endings", narration: "The larger of the two states is the answer. Every constraint ever needed was a choice between two carried numbers.", codeLine: 8 },
    ],
  },
  {
    id: "coins", title: "Coin Change", pattern: "Unbounded knapsack", complexity: "O(amount × coins) time · O(amount) space", input: [1, 2, 5], goal: "Make an amount with the fewest coins, or report that it is impossible.", concept: "Build the answer bottom-up over amounts: best[a] is one plus the best of every reachable a - coin. Ordering the coins does not matter and each coin may be reused, so a single one-dimensional table is enough. Anything not improved stays at the sentinel, which is how impossibility is recorded.", whenToUse: "Use a one-dimensional amount table for unbounded minimum-coin or count-of-ways problems, and add a second dimension only when each coin may be used once.", pitfalls: ["Greedy on the largest coin fails for coins like [1, 3, 4] and amount 6.", "Loop the amount outwards, not the coin count, or reused coins are missed.", "The sentinel has to be larger than any real answer, and the final check must distinguish it."], practice: "Count the number of combinations instead of the minimum, and watch the loop order change the meaning.",
    code: {
      JavaScript: ["function coinChange(coins, amount) {", "  const best = new Array(amount + 1).fill(Infinity);", "  best[0] = 0;", "  for (let total = 1; total <= amount; total++) {", "    for (const coin of coins) {", "      if (coin <= total) best[total] = Math.min(best[total], best[total - coin] + 1);", "    }", "  }", "  return Number.isFinite(best[amount]) ? best[amount] : -1;", "}", "coinChange([1, 2, 5], 11);"],
      Python: ["def coin_change(coins, amount):", "    best = [float(\"inf\")] * (amount + 1)", "    best[0] = 0", "    for total in range(1, amount + 1):", "        for coin in coins:", "            if coin <= total:", "                best[total] = min(best[total], best[total - coin] + 1)", "    return best[amount] if best[amount] != float(\"inf\") else -1", "", "coin_change([1, 2, 5], 11)"],
    },
    steps: [
      { active: [], pointers: ["best[0] = 0"], memory: ["table = [0, inf, inf, inf, ...]"], title: "Amount zero costs nothing", narration: "The only real seed. Every other cell is unreachable until some coin reaches it.", codeLine: 2 },
      { active: [0], pointers: ["total = 1"], memory: ["best[1] = best[0] + 1 = 1"], title: "Small amounts settle first", narration: "Amount 1 is solved by the coin of 1, because subtracting any other coin leaves a negative remainder.", codeLine: 4 },
      { active: [1], pointers: ["total = 2"], memory: ["min(best[1] + 1, best[0] + 1) = 1"], title: "Cheapest predecessor wins", narration: "Two candidate last coins both apply, and the table already knows the best way to reach each remainder.", codeLine: 6 },
      { active: [2], pointers: ["total = 5"], memory: ["best[5] = 1"], title: "A coin that lands exactly", narration: "Amount 5 reads best[0] plus one coin, which is why the loop is over amounts rather than over coin counts.", codeLine: 6 },
      { active: [0, 1, 2], pointers: ["amount = 11"], memory: ["best[11] = 3", "5 + 5 + 1"], title: "Read the answer off the table", narration: "Every larger amount was assembled from already-solved smaller ones, so the fill order was the proof. Greedy on 5 first also happens to work here - it does not in general.", codeLine: 9 },
    ],
  },
];

const lessons: Lesson[] = [...coreLessons, ...curriculum];

/**
 * Stage kind decides how the three.js scene arranges the values. problemNumber
 * links a lesson to judged fixtures so Submit runs for real, operands carry the
 * extra arguments (target, window size) a pattern needs beyond the array, and
 * labTopic points at the free step-by-step simulation on /cslabs.
 */
export type CourseStage = "hash" | "range" | "window" | "pointers" | "stack";
export type CourseLesson = Lesson & { stage: CourseStage; problemNumber: number | null; operands: number[]; entry: string; unit: string; labTopic: string | null };

export type CourseUnit = { id: string; title: string; blurb: string };

export const courseUnits: CourseUnit[] = [
  { id: "pointers", title: "Arrays & two pointers", blurb: "One pass, constant space: squeeze an answer out of ordered indices." },
  { id: "search", title: "Binary search", blurb: "Halve the candidate space - on data, and on the answer itself." },
  { id: "window", title: "Windows & hashing", blurb: "Trade memory for speed: track a range or a membership in O(1)." },
  { id: "stack", title: "Stacks & queues", blurb: "Last out or first out - the container decides what the algorithm sees." },
  { id: "trees", title: "Trees & ordering", blurb: "Keep the data sorted for free and get logarithmic insert, search and delete." },
  { id: "dp", title: "Recursion & dynamic programming", blurb: "Overlap first, then memoise, then flatten the memo into a table." },
];

const lessonMeta: Record<string, { stage: CourseStage; problemNumber: number | null; operands: number[]; entry: string; unit: string; labTopic: string | null }> = {
  "two-pointers": { stage: "pointers", problemNumber: null, operands: [10], entry: "pairSum", unit: "pointers", labTopic: "two-pointers" },
  container: { stage: "pointers", problemNumber: 8, operands: [], entry: "maxArea", unit: "pointers", labTopic: "two-pointers" },
  "prefix-product": { stage: "range", problemNumber: 5, operands: [], entry: "productExceptSelf", unit: "pointers", labTopic: "prefix-sum" },
  kadane: { stage: "window", problemNumber: null, operands: [], entry: "maxSubArray", unit: "pointers", labTopic: "prefix-sum" },
  "binary-search": { stage: "range", problemNumber: 18, operands: [9], entry: "search", unit: "search", labTopic: "binary-search" },
  koko: { stage: "range", problemNumber: 20, operands: [8], entry: "minEatingSpeed", unit: "search", labTopic: "binary-search" },
  "sliding-window": { stage: "window", problemNumber: null, operands: [3], entry: "maxWindowSum", unit: "window", labTopic: "sliding-window" },
  stock: { stage: "pointers", problemNumber: 10, operands: [], entry: "maxProfit", unit: "window", labTopic: "sliding-window" },
  "top-k": { stage: "hash", problemNumber: 4, operands: [2], entry: "topKFrequent", unit: "window", labTopic: "hashing" },
  stack: { stage: "stack", problemNumber: null, operands: [], entry: "reverse", unit: "stack", labTopic: "stack" },
  temperatures: { stage: "stack", problemNumber: 17, operands: [], entry: "dailyTemperatures", unit: "stack", labTopic: "stack" },
  queue: { stage: "stack", problemNumber: null, operands: [], entry: "drain", unit: "stack", labTopic: "queue" },
  "bst-insert": { stage: "pointers", problemNumber: null, operands: [], entry: "insertOrder", unit: "trees", labTopic: "trees" },
  climbing: { stage: "hash", problemNumber: 41, operands: [], entry: "climbStairs", unit: "dp", labTopic: "recursion" },
  robber: { stage: "window", problemNumber: 42, operands: [], entry: "rob", unit: "dp", labTopic: "dp" },
  coins: { stage: "hash", problemNumber: 43, operands: [11], entry: "coinChange", unit: "dp", labTopic: "dp" },
  "two-sum": { stage: "hash", problemNumber: 1, operands: [9], entry: "twoSum", unit: "window", labTopic: "hashing" },
};

export const courseLessons: CourseLesson[] = lessons.map((lesson) => ({ ...lesson, ...(lessonMeta[lesson.id] ?? { stage: "pointers", problemNumber: null, operands: [], entry: "solve", unit: "pointers", labTopic: null }) }));

export function lessonsForUnit(unitId: string): CourseLesson[] {
  return courseLessons.filter((lesson) => lesson.unit === unitId);
}


/** Named markers such as "left = 4" or "top -> 10", positioned by array index. */
export type LessonMarker = { name: string; value: string; index: number | null };

export function lessonMarkers(step: LessonStep): LessonMarker[] {
  return step.pointers.map((pointer) => {
    const assignment = /^(\w+)\s*(?:=|->|→)\s*(-?\d+)$/.exec(pointer.trim());
    if (assignment) return { name: assignment[1] ?? "", value: assignment[2] ?? "", index: Number(assignment[2]) };
    return { name: pointer, value: "", index: null };
  });
}

/** Editor input when a lesson has no judged fixtures: the lesson array plus its operands. */
export function lessonDemoStdin(lesson: CourseLesson): string {
  const lines = [lesson.input.join(" "), ...lesson.operands.map(String)];
  return `${lines.join("\n")}\n`;
}

/** Drops the lesson's self-invoking last line so the submitted program has one entry point. */
export function lessonBody(lesson: CourseLesson, language: "JavaScript" | "Python"): string[] {
  const entry = entryFor(lesson, language);
  const lines = [...lesson.code[language]];
  while (lines.length && new RegExp(`^\\s*${entry}\\s*\\(`).test(lines[lines.length - 1] ?? "")) lines.pop();
  return lines;
}

/** The name the lesson's own code defines: the Python versions are written snake_case. */
function entryFor(lesson: CourseLesson, language: "JavaScript" | "Python"): string {
  if (language !== "Python") return lesson.entry;
  const defs: string[] = [];
  for (const line of lesson.code.Python) {
    const match = /^\s*def\s+(\w+)\s*\(/.exec(line);
    if (match?.[1]) defs.push(match[1]);
  }
  const camel = lesson.entry.toLowerCase();
  const snake = lesson.entry.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  return defs.find((name) => name.toLowerCase() === camel) ?? defs.find((name) => name.toLowerCase() === snake) ?? defs[0] ?? lesson.entry;
}

function jsReader(kind: ArgKind, line: string): string {
  switch (kind) {
    case "ints":
    case "doubles":
      return `${line}.trim() ? ${line}.trim().split(/\\s+/).map(Number) : []`;
    case "strings":
      return `${line}.trim().split(/\\s+/)`;
    case "int":
    case "double":
      return `Number(${line}.trim())`;
    case "bool":
      return `${line}.trim() === "true"`;
    default:
      return line;
  }
}

function pyReader(kind: ArgKind, line: string): string {
  switch (kind) {
    case "ints":
      return `[int(token) for token in ${line}.split()] if ${line}.strip() else []`;
    case "doubles":
      return `[float(token) for token in ${line}.split()] if ${line}.strip() else []`;
    case "strings":
      return `${line}.split()`;
    case "int":
      return `int(${line})`;
    case "double":
      return `float(${line})`;
    case "bool":
      return `${line} == "true"`;
    default:
      return line;
  }
}

const kindLabel = { ints: "integers, space separated", doubles: "numbers, space separated", strings: "words, space separated", int: "an integer", double: "a number", string: "a single word", bool: "true or false" } as const;

/**
 * A starter the runner can actually feed: the lesson's own function plus a
 * driver that reads one argument per line, typed from the judged fixtures.
 * Same shape for both languages so a student can switch without re-learning.
 */
export function starterFor(lesson: CourseLesson, language: "JavaScript" | "Python"): string {
  const entry = entryFor(lesson, language);
  const body = lessonBody(lesson, language).join("\n");
  const kinds = lesson.problemNumber ? argKinds(lesson.problemNumber) : null;
  const names = lesson.problemNumber ? argNames(lesson.problemNumber) : [];
  if (kinds?.length && names.length === kinds.length) {
    const mark = language === "Python" ? "#" : "//";
    const header = `${mark} Judged input: one argument per line.\n${names.map((name, index) => `${mark}   line ${index + 1}: ${name} (${kindLabel[kinds[index]!]})`).join("\n")}\n${mark} Judged output: values separated by single spaces, booleans as true/false.\n`;
    if (language === "Python") {
      const reads = names.map((name, index) => `${name} = ${pyReader(kinds[index]!, `lines[${index}]`)}`);
      return `${header}\nimport sys\n\nlines = sys.stdin.read().splitlines()\n${reads.join("\n")}\n\n${body}\n\nanswer = ${entry}(${names.join(", ")})\nif isinstance(answer, (list, tuple)):\n    print(" ".join("true" if item is True else "false" if item is False else str(item) for item in answer))\nelif isinstance(answer, bool):\n    print("true" if answer else "false")\nelse:\n    print(answer)\n`;
    }
    const reads = names.map((name, index) => `const ${name} = ${jsReader(kinds[index]!, `lines[${index}]`)};`);
    return `${header}\n${body}\n\nconst lines = require("fs").readFileSync(0, "utf8").replace(/(\\r?\\n)+$/, "").split(/\\r?\\n/);\n${reads.join("\n")}\nconst answer = ${entry}(${names.join(", ")});\nconsole.log(Array.isArray(answer) ? answer.join(" ") : answer === true ? "true" : answer === false ? "false" : answer);\n`;
  }
  if (language === "Python") {
    return `# Lesson practice: line 1 is the array, later lines are extra arguments.\n${body}\n\nimport sys\nlines = sys.stdin.read().splitlines()\n\ndef numbers(line):\n    return [int(token) for token in line.split()] if line.strip() else []\n\nvalues = numbers(lines[0]) if lines else []\nextra = [token for line in lines[1:] for token in numbers(line)]\nanswer = ${entry}(values, *extra)\nprint(" ".join(str(item) for item in answer) if isinstance(answer, (list, tuple)) else answer)\n`;
  }
  return `// Lesson practice: line 1 is the array, later lines are extra arguments.\n${body}\n\nconst lines = require("fs").readFileSync(0, "utf8").replace(/(\\r?\\n)+$/, "").split(/\\r?\\n/);\nconst numbers = (line) => (line || "").trim() ? line.trim().split(/\\s+/).map(Number) : [];\nconst values = numbers(lines[0]);\nconst extra = lines.slice(1).flatMap(numbers);\nconst answer = ${entry}(values, ...extra);\nconsole.log(Array.isArray(answer) ? answer.join(" ") : answer);\n`;
}
