import stages from '../stages';

export default function loadStage(name) {
  const stage = stages.findByName(name);
  const url = (stage && stage.url) || null;

  return function(dispatch) {
    dispatch({
      type: 'LOAD_STAGE_ATTEMPT',
      name,
    });

    fetch(url)
    .then((res) => {
      return res.json();
    })
    .then((stage) => {
      const { name, goal, tiles } = stage;
      const action = {
        type: 'LOAD_STAGE_SUCCESS',
        name,
        goal,
        tiles,
      };

      return dispatch(action);
    })
    .then(() => {
      return dispatch({ type: 'READY' });
    })
    .catch((error) => {
      dispatch({
        type: 'LOAD_STAGE_FAIL',
        error: error,
      });
    });
  };
}
