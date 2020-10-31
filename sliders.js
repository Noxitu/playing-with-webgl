
const settings = {}
const settings_elements = {}

function update(key, newValue)
{
    settings[key] = newValue

    const e = document.querySelector(`[data-setting="${key}"]`)
    const value = (settings[key] - e.dataset.min) / (e.dataset.max - e.dataset.min)

    settings_elements[key].style.width = `${100*value}%`
}

function set(x, key)
{
    const e = document.querySelector(`[data-setting="${key}"]`)
    const newValue = x / e.clientWidth * (e.dataset.max - e.dataset.min) + e.dataset.min*1
    update(key, newValue)
}

window.addEventListener('load', function()
{
    document.querySelectorAll('.bar').forEach( bar => {
        if (bar.dataset.value === undefined)
            value = (bar.dataset.min*1 + bar.dataset.max*1) / 2
        else
            value = bar.dataset.value*1        

        const element = document.createElement('div')
        settings_elements[bar.dataset.setting] = element
        bar.append(element)
        bar.addEventListener('mousemove', event => {
            if (event.buttons == 1)
                set(event.offsetX, bar.dataset.setting)
        })
        bar.addEventListener('mousedown', event => {
            if (event.buttons == 1)
                set(event.offsetX, bar.dataset.setting)
        })

        update(bar.dataset.setting, value)
    })

    console.log(settings)
})