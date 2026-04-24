const ServerEvent = {
  JOINED: 'joined',
  ONLINE_COUNT: 'online_count',
  TRAINING_STATE: 'training_state',
  LESSON_RESULT: 'lesson_result',
  COMPETITION_STATE: 'competition_state',
  COMPETITION_FULL: 'competition_full',
  COMPETITION_RESULT: 'competition_result',
  ERROR: 'error',
};

const ClientEvent = {
  JOIN: 'join',
  START_TRAINING: 'start_training',
  START_RANDOM_TRAINING: 'start_random_training',
  TRAINING_INPUT: 'training_input',
  JOIN_COMPETITION: 'join_competition',
  START_COMPETITION: 'start_competition',
  COMPETITION_INPUT: 'competition_input',
  LEAVE_COMPETITION: 'leave_competition',
};

module.exports = { ServerEvent, ClientEvent };
