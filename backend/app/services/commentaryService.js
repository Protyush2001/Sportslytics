class CommentaryService {
  constructor() {
    this.commentaryTemplates = {
      dot: [
        "Excellent delivery! Dot ball.",
        "Defended solidly back to the bowler.",
        "Beaten! That was close to the edge.",
        "Played with soft hands, no run taken.",
        "Good length ball, well blocked.",
        "Dot ball pressure building."
      ],
      run: [
        "Good running between the wickets.",
        "Pushed into the gap for a quick single.",
        "Worked away for {runs} run(s).",
        "Smart cricket, they take {runs}.",
        "Comfortable {runs} run(s) taken."
      ],
      boundary: [
        "CRACKED! That's a beautiful boundary!",
        "Timed to perfection! Races to the boundary.",
        "What a shot! That's {runs} runs.",
        "No stopping that! Pure class.",
        "Shot of the day! Magnificent boundary."
      ],
      six: [
        "WHOA! That's huge! Into the stands!",
        "Monstrous hit! That's a maximum!",
        "Clears the boundary with ease! SIX!",
        "What power! That's out of here!",
        "Audacious shot! SIX runs!"
      ],
      wicket: {
        bowled: [
          "TIMBER! The stumps are shattered!",
          "Clean bowled! That's unplayable!",
          "Through the gate! What a delivery!",
          "Bowled him! Middle stump gone!"
        ],
        caught: [
          "Caught! That's a simple catch.",
          "Edged and taken! Brilliant catch!",
          "Sky high and safely pouched!",
          "What a catch! That's spectacular!"
        ],
        lbw: [
          "Plumb! That's hitting leg stump!",
          "Given out LBW! No doubt about it.",
          "Trapped in front! That's out.",
          "Appeal upheld! LBW decision."
        ],
        runout: [
          "What a mix-up! Run out!",
          "Direct hit! That's brilliant fielding!",
          "Run out! Poor communication there.",
          "Sensational fielding! Run out!"
        ],
        stumped: [
          "Stumped! Quick work by the keeper!",
          "Beaten in flight and stumped!",
          "Miles down the track, stumped!",
          "Brilliant glove work! Stumped!"
        ]
      },
      extra: {
        wide: [
          "Wide called! That's too far outside.",
          "Wayward delivery, called wide.",
          "Sprays it down leg, wide given."
        ],
        noball: [
          "No ball! Free hit coming up!",
          "Overstepping! That's a no ball.",
          "No ball called for height/front foot."
        ]
      }
    };
  }

  generateCommentary(ballData, matchSituation) {
    const { eventType, runs, isWicket, wicketType, extras } = ballData;
    
    let templatePool = [];
    let commentary = "";

    if (isWicket && wicketType) {
      templatePool = this.commentaryTemplates.wicket[wicketType] || 
                    ["Wicket falls! Important breakthrough."];
    } else if (extras) {
      templatePool = this.commentaryTemplates.extra[extras] || 
                    ["Extra runs conceded."];
    } else {
      templatePool = this.commentaryTemplates[eventType] || 
                    ["Interesting delivery played."];
    }

    // Select random template
    const template = templatePool[Math.floor(Math.random() * templatePool.length)];
    
    // Replace placeholders
    commentary = template.replace(/{runs}/g, runs || 0);

    // Add match situation context
    commentary += this.addSituationContext(matchSituation, ballData);

    return commentary;
  }

  addSituationContext(matchSituation, ballData) {
    const { runs, wickets, overs, balls, runRate, requiredRunRate } = matchSituation;
    const totalBalls = overs * 6 + balls;
    
    let context = "";

    if (ballData.isWicket) {
      if (wickets >= 3) context += " The batting side in trouble now.";
      if (wickets >= 6) context += " Middle order collapse!";
    }

    if (ballData.runs >= 4) {
      if (requiredRunRate && runRate > requiredRunRate) {
        context += " They're ahead of the required rate.";
      } else if (runRate > 8) {
        context += " Scoring at a brisk pace.";
      }
    }

    if (totalBalls % 6 === 0 && totalBalls > 0) {
      context += ` End of over ${overs}. Score: ${runs}/${wickets}.`;
    }

    return context;
  }

  // Generate AI insights for key moments
  generateAIInsights(commentaryHistory, currentSituation) {
    const insights = [];
    const last5Overs = commentaryHistory.filter(c => 
      c.ballNumber.over >= currentSituation.overs - 5
    );

    // Run rate analysis
    const recentRuns = last5Overs.reduce((sum, ball) => sum + (ball.event.runs || 0), 0);
    const recentBalls = last5Overs.length;
    const recentRunRate = recentBalls > 0 ? (recentRuns / recentBalls * 6).toFixed(2) : 0;

    if (recentRunRate > 9) {
      insights.push("Batting team dominating the last 5 overs!");
    } else if (recentRunRate < 5) {
      insights.push("Bowlers putting pressure in recent overs.");
    }

    // Wicket analysis
    const recentWickets = last5Overs.filter(ball => ball.event.isWicket).length;
    if (recentWickets >= 2) {
      insights.push(`Bowlers on fire! ${recentWickets} wickets in quick succession.`);
    }

    // Partnership analysis
    const lastWicketBall = [...commentaryHistory].reverse().find(ball => ball.event.isWicket);
    if (lastWicketBall) {
      const partnershipRuns = currentSituation.runs - (lastWicketBall.matchSituation.runs || 0);
      if (partnershipRuns > 50) {
        insights.push(`Solid partnership of ${partnershipRuns} runs building.`);
      }
    }

    return insights;
  }
}

module.exports = new CommentaryService();