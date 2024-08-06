import AsyncLock from "async-lock";

const lock = new AsyncLock({
  maxExecutionTime: 2000,
});

export default lock;
