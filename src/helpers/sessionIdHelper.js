// helpers/sessionIdHelper.js
function getSessionId() {
  let id = localStorage.getItem('session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('session_id', id);
  }
  return id;
}
export default getSessionId;
