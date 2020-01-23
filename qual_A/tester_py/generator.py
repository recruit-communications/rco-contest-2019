from sys import argv
from testcase import TestCase


if __name__ == '__main__':
    seed = 1 if len(argv) <= 1 else int(argv[1])
    tc = TestCase(seed)
    print(tc)
