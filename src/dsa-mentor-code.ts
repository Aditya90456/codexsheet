// The last board step always shows the finished shape of the answer, so the
// student leaves the lesson holding one block of code they could type today.
export const lessonFinal: Record<MentorPatternId, string> = {
  hashing: "def two_sum(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        if target - x in seen: return [seen[target - x], i]\n        seen[x] = i",
  "two-pointers": "while left < right:\n    if a[left] + a[right] == target: return [left, right]\n    left += 1 if a[left] + a[right] < target else 0\n    right -= 1 if a[left] + a[right] > target else 0",
  "sliding-window": "best = 0\nfor right in range(n):\n    window[s[right]] += 1\n    while invalid(window):\n        window[s[left]] -= 1; left += 1\n    best = max(best, right - left + 1)",
  stack: "for c in s:\n    if c in '([{': stack.append(c)\n    elif not stack or pairs[stack.pop()] != c: return False\nreturn not stack",
  "monotonic-stack": "for i, x in enumerate(nums):\n    while stack and x > nums[stack[-1]]:\n        ans[stack.pop()] = x\n    stack.append(i)",
  "binary-search": "while lo <= hi:\n    mid = lo + (hi - lo) // 2\n    if a[mid] == target: return mid\n    if a[mid] < target: lo = mid + 1\n    else: hi = mid - 1\nreturn lo",
  "linked-list": "while curr:\n    nxt = curr.next\n    curr.next = prev\n    prev, curr = curr, nxt\nreturn prev",
  trees: "def depth(node):\n    if not node: return 0\n    return 1 + max(depth(node.left), depth(node.right))",
  graphs: "while q:\n    node = q.popleft()\n    for nxt in adj[node]:\n        if nxt not in seen:\n            seen.add(nxt); dist[nxt] = dist[node] + 1; q.append(nxt)",
  backtracking: "for choice in choices:\n    if not valid(choice): continue\n    path.append(choice)\n    search(depth + 1)\n    path.pop()",
  heaps: "for num in nums:\n    heappush(heap, num)\n    if len(heap) > k: heappop(heap)\nreturn heap[0]",
  intervals: "for start, end in sorted(intervals):\n    if merged and start <= merged[-1][1]: merged[-1][1] = max(merged[-1][1], end)\n    else: merged.append([start, end])",
  "dp-1d": "prev2 = prev = 0\nfor x in nums:\n    prev2, prev = prev, max(prev, prev2 + x)\nreturn prev",
  "dp-2d": "for r in range(1, len(a) + 1):\n    for c in range(1, len(b) + 1):\n        dp[r][c] = dp[r-1][c-1] + 1 if a[r-1] == b[c-1] else max(dp[r-1][c], dp[r][c-1])",
  greedy: "for i, x in enumerate(nums):\n    if i > reach: return False\n    reach = max(reach, i + x)\nreturn True",
  bits: "acc = 0\nfor v in nums:\n    acc ^= v\nreturn acc",
};

// arrive with the syntax that implements them. Python, because it reads out loud.
import type { MentorPatternId } from "./dsa-mentor-brain";

export const lessonCode: Record<MentorPatternId, string[]> = {
  hashing: [
    "i = hash(key) % 8                 # the bucket it lands in",
    "need = target - num\nif need in seen: return [seen[need], i]",
    "seen[num] = i                     # collisions are the map's job",
  ],
  "two-pointers": [
    "left, right = 0, len(nums) - 1",
    "while left < right:\n    s = nums[left] + nums[right]",
    "if s < target: left += 1\n    else: right -= 1     # each side once",
  ],
  "sliding-window": [
    "left = 0\nfor right in range(len(s)):\n    window.add(s[right])",
    "while invalid(window):\n    window.remove(s[left])\n    left += 1",
    "best = max(best, right - left + 1)   # after shrinking",
  ],
  stack: [
    "if c in '([{': stack.append(c)",
    "elif not stack or pairs[stack.pop()] != c: return False",
    "return not stack                   # nothing left hanging",
  ],
  "monotonic-stack": [
    "stack = []                         # indices, values decreasing",
    "while stack and nums[i] > nums[stack[-1]]:\n    ans[stack.pop()] = nums[i]",
    "return ans                         # leftovers stay -1",
  ],
  "binary-search": [
    "lo, hi = 0, len(a) - 1",
    "mid = lo + (hi - lo) // 2\nif a[mid] < target: lo = mid + 1\nelse: hi = mid - 1",
    "return lo                          # the insertion point",
  ],
  "linked-list": [
    "prev, curr = None, head",
    "nxt = curr.next                    # save before cutting",
    "curr.next, prev, curr = prev, curr, nxt",
  ],
  trees: [
    "return 1 + max(depth(root.left), depth(root.right))",
    "if not node: return 0              # the nothing-value",
    "for child in adj[node]:\n    if child not in seen: q.append(child)",
  ],
  graphs: [
    "q = deque([start]); seen = {start}",
    "node = q.popleft()\nfor nxt in adj[node]:\n    if nxt not in seen: seen.add(nxt); q.append(nxt)",
    "dist[nxt] = dist[node] + 1         # layer = shortest steps",
  ],
  backtracking: [
    "for choice in candidates:\n    if not valid(choice): continue",
    "path.append(choice)\nsearch(depth + 1)",
    "path.pop()                         # un-choose for the siblings",
  ],
  heaps: [
    "heap = []                          # min-heap capped at k",
    "heappush(heap, num)\nif len(heap) > k: heappop(heap)",
    "return heap[0]                     # the k-th largest",
  ],
  intervals: [
    "intervals.sort(key=lambda x: x[0])",
    "if start <= merged[-1][1]:\n    merged[-1][1] = max(merged[-1][1], end)",
    "else: merged.append([start, end])  # close, start fresh",
  ],
  "dp-1d": [
    "dp = [0] * (n + 1)                 # dp[i] = best for first i",
    "dp[i] = max(dp[i - 1], dp[i - 2] + nums[i - 1])",
    "return dp[n]                       # filled left to right",
  ],
  "dp-2d": [
    "dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]",
    "dp[r][c] = dp[r-1][c-1] + 1 if a[r-1] == b[c-1] else max(dp[r-1][c], dp[r][c-1])",
    "return dp[len(a)][len(b)]          # bottom-right corner",
  ],
  greedy: [
    "reach = 0",
    "reach = max(reach, i + nums[i])\nif i > reach: return False",
    "return True                        # one pass, O(1) space",
  ],
  bits: [
    "acc = 0\nfor v in nums: acc ^= v",
    "while n:\n    n &= n - 1             # drops the lowest set bit\n    count += 1",
    "return acc                         # pairs vanish, one survives",
  ],
};
