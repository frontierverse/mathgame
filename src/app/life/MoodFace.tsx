import { MOODS, type MoodScore } from "./mood";

export default function MoodFace({
  score = 3,
  className,
}: {
  score?: MoodScore;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 116"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="60" cy="107" rx="33" ry="5" fill="#504362" opacity=".08" />
      <path
        d="M23 37C15 13 34 8 44 24C54 20 66 20 76 24C86 8 105 13 97 37C112 51 114 83 95 96C80 107 40 107 25 96C6 83 8 51 23 37Z"
        fill={MOODS[score].color}
      />
      <path
        d="M28 33C25 24 30 21 35 29M85 29C90 21 95 24 92 33"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".45"
      />
      <ellipse cx="33" cy="73" rx="8" ry="4.5" fill="#d98195" opacity=".45" />
      <ellipse cx="87" cy="73" rx="8" ry="4.5" fill="#d98195" opacity=".45" />
      {score >= 4 ? (
        <g stroke="#494055" strokeWidth="4" strokeLinecap="round">
          <path d="M36 61Q42 52 48 61M72 61Q78 52 84 61" />
        </g>
      ) : (
        <g fill="#494055">
          <ellipse cx="42" cy="61" rx="3.3" ry={score === 0 ? 3 : 4.5} />
          <ellipse cx="78" cy="61" rx="3.3" ry={score === 0 ? 3 : 4.5} />
        </g>
      )}
      {score <= 1 && (
        <path
          d="M36 49L46 52M74 52L84 49"
          stroke="#494055"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      )}
      {score === 0 && (
        <path
          d="M82 69C82 69 77 76 82 78C87 76 82 69 82 69Z"
          fill="#fff"
          opacity=".85"
        />
      )}
      {score <= 1 ? (
        <path
          d="M51 82Q60 73 69 82"
          stroke="#494055"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ) : score === 2 ? (
        <path
          d="M52 78H68"
          stroke="#494055"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ) : score === 3 ? (
        <path
          d="M51 75Q60 85 69 75"
          stroke="#494055"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d={
              score === 5
                ? "M48 73Q60 76 72 73Q72 92 60 92Q48 92 48 73"
                : "M50 74Q60 78 70 74Q69 87 60 87Q51 87 50 74"
            }
            fill="#494055"
          />
          <path
            d="M55 85Q60 81 65 85"
            stroke="#ed9ca7"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      <path
        d="M49 105L44 109M71 105L76 109"
        stroke={MOODS[score].color}
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}
