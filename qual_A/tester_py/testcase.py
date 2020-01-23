import math

N = 200
MIN_X = 0
MAX_X = 500
MIN_Y = 0
MAX_Y = 500


class XorShift:
    mask = (1 << 64) - 1

    def __init__(self, seed=None):
        self.x = seed or 88172645463325252

    def next(self):
        self.x ^= self.x << 13
        self.x &= self.mask
        self.x ^= self.x >> 7
        self.x ^= self.x << 17
        self.x &= self.mask
        return self.x

    def next_int(self, n):
        upper = self.mask // n * n
        v = self.next()
        while upper <= v:
            v = self.next()
        return v % n


class TestCase:

    def __init__(self, seed=None, input=None):
        self.X = []
        self.Y = []
        if seed is not None:
            self.N = N
            rnd = XorShift(seed)
            for _ in range(self.N):
                self.X.append(rnd.next_int(MAX_X - MIN_X + 1) + MIN_X)
                self.Y.append(rnd.next_int(MAX_Y - MIN_Y + 1) + MIN_Y)
        else:
            itr = iter(input)
            self.N = int(next(itr))
            for i in range(self.N):
                x, y = tuple(map(int, next(itr).split()))
                self.X.append(x)
                self.Y.append(y)

    def __str__(self):
        ret = "%d\n" % self.N
        return ret + "\n".join("%d %d" % (self.X[i], self.Y[i]) for i in range(self.N))

    @classmethod
    def calc_dist(cls, x0, y0, x1, y1):
        return math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1))

    def variance(self, permutation):
        if len(permutation) != self.N:
            raise RuntimeError("answer length != N")
        used = [False] * self.N
        for i in range(self.N):
            if permutation[i] < 0 or permutation[i] >= self.N:
                raise RuntimeError("%dth answer is out of range" % i)
            used[permutation[i]] = True
        for i in range(self.N):
            if not used[i]:
                raise RuntimeError("%d is not used." % i)
        dists = []
        for i in range(self.N):
            pre = permutation[i]
            cur = permutation[(i + 1) % self.N]
            dists.append(self.calc_dist(self.X[pre], self.Y[pre], self.X[cur], self.Y[cur]))
        avg = sum(dists) / self.N
        var = 0.0
        for i in range(self.N):
            var += (dists[i] - avg) ** 2
        var /= self.N
        return var
