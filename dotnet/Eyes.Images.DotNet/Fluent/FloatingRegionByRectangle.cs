﻿using System.Collections.Generic;
using System.Drawing;
using Applitools.Commands;

namespace Applitools
{
    public class FloatingRegionByRectangle : IGetFloatingRegion
    {
        private readonly int maxDownOffset_;
        private readonly int maxLeftOffset_;
        private readonly int maxRightOffset_;
        private readonly int maxUpOffset_;

        private Rectangle rect_;

        public FloatingRegionByRectangle(Rectangle rect, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset)
        {
            rect_ = rect;
            maxUpOffset_ = maxUpOffset;
            maxDownOffset_ = maxDownOffset;
            maxLeftOffset_ = maxLeftOffset;
            maxRightOffset_ = maxRightOffset;
        }

        public FloatingRegionByRectangle(Point location, Size size, int maxUpOffset = 0, int maxDownOffset = 0, int maxLeftOffset = 0, int maxRightOffset = 0)
        {
            rect_ = new Rectangle(location, size);
            maxDownOffset_ = maxDownOffset;
            maxUpOffset_ = maxUpOffset;
            maxLeftOffset_ = maxLeftOffset;
            maxRightOffset_ = maxRightOffset;
        }

        public IList<FloatingMatchSettings> GetRegions(IEyesBase eyesBase, IEyesScreenshot screenshot)
        {
            return new[] {
                new FloatingMatchSettings() {
                    Left = rect_.Left,
                    Top = rect_.Top,
                    Width = rect_.Width,
                    Height = rect_.Height,
                    MaxLeftOffset = maxLeftOffset_,
                    MaxUpOffset = maxUpOffset_,
                    MaxRightOffset= maxRightOffset_,
                    MaxDownOffset = maxDownOffset_
                }
            };
        }

        public TFloatingRegion ToRegion()
        {
            return new RectangleFloatingRegion
            {
                Region = new UniversalRegion
                {
                    X = rect_.Left,
                    Y = rect_.Top,
                    Width = rect_.Width,
                    Height = rect_.Height
                },
                Offset = new Padding(maxLeftOffset_, maxUpOffset_, maxRightOffset_, maxDownOffset_)
            };
        }
    }
}