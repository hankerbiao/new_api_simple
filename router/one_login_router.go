package router

import (
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-gonic/gin"
)

func SetOneLoginRouter(router *gin.Engine) {
	oneLoginRouter := router.Group("/auth/one-login")
	oneLoginRouter.Use(
		middleware.RouteTag("one-login"),
		middleware.OneLoginRateLimit(),
		middleware.DisableCache(),
	)
	oneLoginRouter.GET("/login", controller.StartOneLogin)
	oneLoginRouter.GET("/callback", controller.HandleOneLoginCallback)
}
