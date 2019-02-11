import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Scanner;

@SuppressWarnings("ALL")
class TestCase {
	static final int MIN_X = 0;
	static final int MAX_X = 500;
	static final int MIN_Y = 0;
	static final int MAX_Y = 500;

	int N;
	SecureRandom rnd;
	// 各点の座標
	int[] X;
	int[] Y;

	TestCase(long seed) {
		try {
			rnd = SecureRandom.getInstance("SHA1PRNG");
		} catch (NoSuchAlgorithmException e) {
			e.printStackTrace();
		}
		rnd.setSeed(seed);

		N = 200;
		X = new int[N];
		Y = new int[N];
		for (int i = 0; i < N; i++) {
			X[i] = getRandomInt(MIN_X, MAX_X);
			Y[i] = getRandomInt(MIN_Y, MAX_Y);
		}
	}

	TestCase(Scanner sc) {
		N = sc.nextInt();
		X = new int[N];
		Y = new int[N];
		for (int i = 0; i < N; i++) {
			X[i] = sc.nextInt();
			Y[i] = sc.nextInt();
		}
	}

	private static double calcDist(int x0, int y0, int x1, int y1) {
		return Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
	}

	// O(N).
	public double variance(int[] permutation) {
		if (permutation.length != N) throw new IllegalArgumentException("answer length != N");

		boolean[] used = new boolean[N];
		for (int i = 0; i < N; i++) {
			if (permutation[i] < 0 || permutation[i] >= N) throw new IllegalArgumentException(String.format("%dth answer is out of range", i));
			used[permutation[i]] = true;
		}

		for (int i = 0; i < N; i++) {
			if (!used[i]) throw new IllegalArgumentException(String.format("%d is not used.", i));
		}

		double[] dists = new double[N];

		for (int i = 1; i <= N; i++) {
			int pre = permutation[i - 1];
			int cur = permutation[i % N];
			dists[i-1] = calcDist(X[pre], Y[pre], X[cur], Y[cur]);
		}

		double avg = 0;
		for (int i = 0; i < N; i++) {
			avg += dists[i];
		}
		avg /= N;

		double var = 0;
		for (int i = 0; i < N; i++) {
			var += (dists[i] - avg) * (dists[i] - avg);
		}
		var /= N;

		return var;
	}

	@Override
	public String toString() {
		StringBuilder sb = new StringBuilder();
		sb.append(N).append('\n');
		for (int i = 0; i < N; i++) {
			sb.append(X[i]).append(' ').append(Y[i]).append('\n');
		}
		return sb.toString();
	}

	private int getRandomInt(int minInclusive, int maxInclusive) {
		return rnd.nextInt(maxInclusive - minInclusive + 1) + minInclusive;
	}
}
