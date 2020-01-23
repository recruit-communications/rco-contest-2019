from math import ceil
from sys import argv
from testcase import TestCase


def usage():
    print("python judge.py [testdata_file_path] [output_file_path]")


if __name__ == '__main__':
    if len(argv) < 3:
        usage()
        exit(1)
    with open(argv[1]) as in_file:
        tc = TestCase(input=in_file)
    with open(argv[2]) as out_file:
        permutation = []
        for i in range(tc.N):
            line = next(out_file, None)
            if line is None:
                raise RuntimeError("出力がN行ありません")
            try:
                p = int(line)
                permutation.append(p)
            except ValueError:
                raise RuntimeError("%d行目 : 出力が整数ではありません" % (i + 1))
        for tail in out_file:
            if tail.strip():
                raise RuntimeError("末尾に余計な出力があります")
    variance = tc.variance(permutation)
    score = ceil(1e6 / (1 + variance))
    print("score:%d" % score)
