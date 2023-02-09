// this fn will catch (try-catch) error asyncroniously - returns a promise (successful or rejected)
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next)
    }
}